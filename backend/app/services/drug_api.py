import requests
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

RXNAV_BASE = "https://rxnav.nlm.nih.gov/REST"
OPENFDA_BASE = "https://api.fda.gov/drug/label.json"

# Clearance multiplier: medication is considered active until this many half-lives have passed
# 5 half-lives = 97% clearance, 7 half-lives = 99% clearance
DRUG_CLEARANCE_MULTIPLIER = 5

HIGH_SEVERITY_KEYWORDS = [
    'high', 'critical', 'contraindicated', 'serious', 'severe',
    'fatal', 'life-threatening', 'do not use', 'avoid', 'dangerous',
    'hemorrhage', 'bleeding', 'cardiac arrest', 'arrhythmia', 'torsade',
    'serotonin syndrome', 'hypertensive crisis', 'respiratory depression'
]

# Known dangerous drug combinations (fatal/critical interactions)
CRITICAL_DRUG_COMBOS = [
    # (drug1, drug2) - order-independent
    ('warfarin', 'aspirin'),
    ('warfarin', 'ibuprofen'),
    ('warfarin', 'naproxen'),
    ('warfarin', 'diclofenac'),
    ('warfarin', 'ketorolac'),
    ('metformin', 'alcohol'),
    ('maois', 'tyramine'),
    ('ssri', 'maois'),
    ('methotrexate', 'nsaid'),
    ('lithium', 'nsaid'),
    ('lithium', 'ace inhibitor'),
    ('lithium', 'thiazide'),
    ('cisapride', 'antifungal'),
    ('terfenadine', 'ketoconazole'),
    ('cisapride', 'macrolide'),
    ('thioridazine', 'antipsychotic'),
    ('mefloquine', 'quinine'),
    ('haloperidol', 'antiarrhythmic'),
]


def get_rxcui(drug_name: str):
    try:
        url = f"{RXNAV_BASE}/rxcui.json"
        r = requests.get(url, params={"name": drug_name, "allsrc": "0"}, timeout=5)
        data = r.json()
        cuis = data.get("idGroup", {}).get("rxnormId", [])
        if cuis:
            return cuis[0]
        r2 = requests.get(f"{RXNAV_BASE}/spellingsuggestions.json", params={"name": drug_name}, timeout=5)
        suggestions = r2.json().get("suggestionGroup", {}).get("suggestionList", {}).get("suggestion", [])
        if suggestions:
            r3 = requests.get(url, params={"name": suggestions[0]}, timeout=5)
            cuis2 = r3.json().get("idGroup", {}).get("rxnormId", [])
            return cuis2[0] if cuis2 else None
        return None
    except Exception as e:
        logger.warning(f"RxCUI lookup failed for {drug_name}: {e}")
        return None


def _classify_interaction(severity: str, description: str) -> bool:
    desc_lower = description.lower()
    sev_lower = severity.lower()
    return (
        sev_lower in ("high", "critical") or
        any(kw in desc_lower for kw in HIGH_SEVERITY_KEYWORDS) or
        any(kw in sev_lower for kw in HIGH_SEVERITY_KEYWORDS)
    )


def calculate_drug_active_window(last_dose_time, half_life_hours):
    """
    Calculate when a drug will be active in the body.
    Returns (start_time, end_time) tuple.
    Drug is considered active until DRUG_CLEARANCE_MULTIPLIER * half_life_hours have passed.
    """
    if not last_dose_time or not half_life_hours or half_life_hours <= 0:
        return None, None
    
    if isinstance(last_dose_time, str):
        last_dose_time = datetime.fromisoformat(last_dose_time.replace('Z', '+00:00'))
    
    start_time = last_dose_time
    end_time = last_dose_time + timedelta(hours=half_life_hours * DRUG_CLEARANCE_MULTIPLIER)
    return start_time, end_time


def check_active_windows_overlap(med1_dose_time, med1_half_life, med2_dose_time, med2_half_life):
    """
    Check if two medications have overlapping active time windows.
    Returns True if they overlap (both are active at the same time).
    """
    if not all([med1_dose_time, med1_half_life, med2_dose_time, med2_half_life]):
        return False
    
    if not isinstance(med1_dose_time, datetime):
        med1_dose_time = datetime.fromisoformat(str(med1_dose_time).replace('Z', '+00:00'))
    if not isinstance(med2_dose_time, datetime):
        med2_dose_time = datetime.fromisoformat(str(med2_dose_time).replace('Z', '+00:00'))
    
    med1_start, med1_end = calculate_drug_active_window(med1_dose_time, med1_half_life)
    med2_start, med2_end = calculate_drug_active_window(med2_dose_time, med2_half_life)
    
    if not all([med1_start, med1_end, med2_start, med2_end]):
        return False
    
    # Check if windows overlap: med1.start < med2.end AND med2.start < med1.end
    return med1_start < med2_end and med2_start < med1_end


def check_pharmacokinetic_interactions(new_medication, existing_medications):
    """
    Check for dangerous drug interactions based on overlapping active time windows.
    Medications are considered to interact if they're both active in the body at the same time.
    
    Args:
        new_medication: Medication object (the one being added)
        existing_medications: List of Medication objects (current medications)
    
    Returns:
        List of dangerous interactions based on pharmacokinetic overlap
    """
    interactions = []
    new_last_dose = datetime.utcnow()
    
    for existing_med in existing_medications:
        existing_last_dose = None
        
        # Get the last actual dose time from DoseLog
        if hasattr(existing_med, 'dose_logs') and existing_med.dose_logs:
            taken_logs = [log for log in existing_med.dose_logs if log.status == 'taken']
            if taken_logs:
                taken_logs.sort(key=lambda x: x.taken_time or x.created_at, reverse=True)
                existing_last_dose = taken_logs[0].taken_time or taken_logs[0].created_at
            else:
                existing_last_dose = existing_med.next_dose_time or datetime.utcnow()
        else:
            existing_last_dose = existing_med.next_dose_time or datetime.utcnow()
        
        # Check if active windows overlap
        if check_active_windows_overlap(new_last_dose, new_medication.half_life_hours, 
                                       existing_last_dose, existing_med.half_life_hours):
            # Check if this is a known critical combo
            combo_key = (new_medication.name.lower(), existing_med.name.lower())
            is_known_critical = False
            for drug1, drug2 in CRITICAL_DRUG_COMBOS:
                if ((drug1 in combo_key[0] and drug2 in combo_key[1]) or
                    (drug2 in combo_key[0] and drug1 in combo_key[1])):
                    is_known_critical = True
                    break
            
            if is_known_critical:
                interactions.append({
                    'med1': new_medication.name,
                    'med2': existing_med.name,
                    'reason': 'Pharmacokinetic overlap: Both medications will be active in your body at the same time, creating a dangerous interaction',
                    'is_critical': True
                })
    
    return interactions


def check_drug_interactions(new_rxcui: str, existing_rxcuis: list):
    if not existing_rxcuis or not new_rxcui:
        return {"has_critical": False, "interactions": []}

    valid_existing = [c for c in existing_rxcuis if c]
    if not valid_existing:
        return {"has_critical": False, "interactions": []}

    critical = []
    all_interactions = []
    
    # Get medication name for critical combo checking
    # Note: new_rxcui is just the ID, we'll need to map it, but we can check via interactions
    
    url = f"{RXNAV_BASE}/interaction/list.json"

    # Method 1: bulk check
    all_cuis = [new_rxcui] + valid_existing
    rxcui_str = "+".join(all_cuis)
    try:
        r = requests.get(url, params={"rxcuis": rxcui_str}, timeout=10)
        data = r.json()
        for group in data.get("fullInteractionTypeGroup", []):
            for itype in group.get("fullInteractionType", []):
                for pair in itype.get("interactionPair", []):
                    sev = pair.get("severity", "")
                    desc = pair.get("description", "")
                    drugs = [c.get("minConceptItem", {}).get("name", "") for c in pair.get("interactionConcept", [])]
                    is_crit = _classify_interaction(sev, desc)
                    
                    # Check if this is a known critical combo
                    drug_names = [d.lower() for d in drugs]
                    for combo in CRITICAL_DRUG_COMBOS:
                        if (any(combo[0] in name for name in drug_names) and 
                            any(combo[1] in name for name in drug_names)):
                            is_crit = True
                            break
                    
                    entry = {"severity": sev or "CRITICAL", "description": desc, "drugs": drugs,
                             "source": group.get("sourceName", ""), "is_critical": is_crit}
                    all_interactions.append(entry)
                    if is_crit:
                        critical.append(entry)
    except Exception as e:
        logger.warning(f"Bulk interaction check failed: {e}")

    # Method 2: pairwise check (catches additional interactions)
    for existing_cui in valid_existing:
        try:
            r2 = requests.get(url, params={"rxcuis": f"{new_rxcui}+{existing_cui}"}, timeout=8)
            for group in r2.json().get("fullInteractionTypeGroup", []):
                for itype in group.get("fullInteractionType", []):
                    for pair in itype.get("interactionPair", []):
                        sev = pair.get("severity", "")
                        desc = pair.get("description", "")
                        drugs = [c.get("minConceptItem", {}).get("name", "") for c in pair.get("interactionConcept", [])]
                        is_crit = _classify_interaction(sev, desc)
                        
                        # Check if this is a known critical combo
                        drug_names = [d.lower() for d in drugs]
                        for combo in CRITICAL_DRUG_COMBOS:
                            if (any(combo[0] in name for name in drug_names) and 
                                any(combo[1] in name for name in drug_names)):
                                is_crit = True
                                break
                        
                        entry = {"severity": sev or ("CRITICAL" if is_crit else "N/A"), "description": desc, "drugs": drugs,
                                 "source": group.get("sourceName", ""), "is_critical": is_crit}
                        # Deduplicate
                        if not any(e["description"] == desc for e in all_interactions):
                            all_interactions.append(entry)
                            if is_crit:
                                critical.append(entry)
        except Exception:
            pass

    return {
        "has_critical": len(critical) > 0,
        "critical_interactions": critical,
        "all_interactions": all_interactions
    }


def fetch_fda_drug_info(drug_name: str):
    """Fetch drug info from multiple sources: FDA, RxNav, and Wikipedia"""
    info = {
        "description": "",
        "side_effects": "",
        "boxed_warnings": ""
    }
    
    # Try FDA database
    try:
        for search_param in [
            f'openfda.brand_name:"{drug_name}"',
            f'openfda.generic_name:"{drug_name}"',
            drug_name
        ]:
            r = requests.get(OPENFDA_BASE, params={"search": search_param, "limit": 1}, timeout=8)
            if r.status_code == 200:
                results = r.json().get("results", [])
                if results:
                    label = results[0]
                    info["description"] = " ".join(label.get("indications_and_usage", []))
                    info["side_effects"] = " ".join(label.get("adverse_reactions", []))
                    info["boxed_warnings"] = " ".join(label.get("boxed_warning", []))
                    if info["description"]:  # Found it in FDA
                        return info
    except Exception as e:
        logger.warning(f"FDA lookup failed for {drug_name}: {e}")
    
    # If FDA didn't have it, try RxNav for drug properties
    try:
        rxcui = get_rxcui(drug_name)
        if rxcui:
            # Get drug properties from RxNav
            r = requests.get(f"{RXNAV_BASE}/rxcui/{rxcui}/properties.json", timeout=8)
            if r.status_code == 200:
                props = r.json().get("properties", {})
                # Use the RxNav name as fallback
                if not info["description"]:
                    info["description"] = f"Generic name: {props.get('name', drug_name)}. A medication used in clinical practice."
    except Exception as e:
        logger.warning(f"RxNav drug properties lookup failed: {e}")
    
    # Try Wikipedia as final fallback
    if not info["description"]:
        try:
            wiki_url = "https://en.wikipedia.org/w/api.php"
            params = {
                "action": "query",
                "titles": drug_name,
                "prop": "extracts",
                "explaintext": True,
                "exsectionformat": "wiki",
                "format": "json"
            }
            r = requests.get(wiki_url, params=params, timeout=8)
            if r.status_code == 200:
                pages = r.json().get("query", {}).get("pages", {})
                for page in pages.values():
                    extract = page.get("extract", "")
                    if extract:
                        # Take first 500 chars
                        info["description"] = extract[:500].strip()
                        break
        except Exception as e:
            logger.warning(f"Wikipedia lookup failed for {drug_name}: {e}")
    
    # If still nothing, provide generic description
    if not info["description"]:
        info["description"] = f"{drug_name} is a medication. Please consult your healthcare provider for specific information about this drug."
    
    return info