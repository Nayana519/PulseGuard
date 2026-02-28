import React from "react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, #f8f9fa 0%, #f0f4f8 100%)",
      }}
    >
      {/* Navigation */}
      <nav
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black"
            style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
          >
            💊
          </div>
          <span className="font-black text-lg text-gray-900">Medivia</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm font-semibold text-gray-700 hover:text-purple-600 transition"
          >
            Features
          </a>
          <a
            href="#about"
            className="text-sm font-semibold text-gray-700 hover:text-purple-600 transition"
          >
            About
          </a>
          <a
            href="#contact"
            className="text-sm font-semibold text-gray-700 hover:text-purple-600 transition"
          >
            Contact
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="px-6 py-2 rounded-lg font-bold text-sm transition-all"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #2563eb)",
              color: "white",
              boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
            }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-32 text-center">
        <div className="mb-8">
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 leading-tight">
            Your Medication
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Safety Guardian
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Real-time drug interaction detection, medication reminders, and
            pharmacokinetic safety monitoring—all powered by medical-grade AI.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            to="/auth"
            className="px-8 py-4 rounded-xl font-bold text-white transition-all hover:shadow-xl"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #2563eb)",
              boxShadow: "0 8px 30px rgba(124,58,237,0.35)",
            }}
          >
            Start Protecting Your Health →
          </Link>
          <button
            className="px-8 py-4 rounded-xl font-bold text-gray-900 transition-all"
            style={{
              background: "white",
              border: "2px solid rgba(124,58,237,0.2)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            Learn More
          </button>
        </div>

        {/* Hero Image/Stats */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 mb-20">
          {[
            { icon: "💊", value: "NIH", label: "RxNav Powered" },
            { icon: "🛡️", value: "FDA", label: "Drug Database" },
            { icon: "⚡", value: "Live", label: "Real-Time Checks" },
            ].map((stat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl"
              style={{
                background: "white",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-black text-gray-900">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Full Width Feature Image */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(124,58,237,0.05), rgba(37,99,235,0.05))",
            border: "1px solid rgba(124,58,237,0.1)",
            padding: "3rem",
            minHeight: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="text-center">
            <div className="text-6xl mb-4">🔐</div>
            <p className="text-gray-600 text-lg font-semibold">
              Advanced Safety Monitoring Dashboard
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Real-time alerts, dosage tracking, and interaction warnings
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 md:py-32"
        style={{ background: "white" }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Powerful Safety Features
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to take medications safely and stay informed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: "⚡",
                title: "Real-Time Interaction Detection",
                desc: "Instantly identify dangerous drug combinations before they happen. Cross-reference against 10,000+ medications.",
              },
              {
                icon: "⏰",
                title: "Smart Reminders",
                desc: "Never miss a dose. Customizable alerts with gentle audio notifications 5 minutes before each scheduled dosage.",
              },
              {
                icon: "📊",
                title: "Pharmacokinetic Monitoring",
                desc: "Advanced calculation of drug active windows. Detect overlaps even when medications are taken hours apart.",
              },
              {
                icon: "🏥",
                title: "Caregiver Integration",
                desc: "Allow family members or healthcare providers to monitor compliance and receive critical safety alerts.",
              },
              {
                icon: "📱",
                title: "Emergency QR Code",
                desc: "One-scan access to complete medication profile, allergies, and emergency contact in case of emergency.",
              },
              {
                icon: "🧬",
                title: "FDA Drug Database",
                desc: "Complete drug information including boxed warnings, side effects, and clinical indications for every medication.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-8 rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(124,58,237,0.02), rgba(37,99,235,0.02))",
                  border: "1px solid rgba(124,58,237,0.1)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(124,58,237,0.15)";
                  e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "rgba(124,58,237,0.1)";
                }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-black text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                About Medivia
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                Medivia is a comprehensive medication safety platform
                designed to protect patients from preventable drug interactions
                and dosing errors. Our mission is to empower individuals and
                healthcare providers with real-time safety intelligence.
              </p>
              <p className="text-lg text-gray-600 mb-4">
                Built on cutting-edge pharmacokinetic science and integrated
                with trusted medical databases (NIH RxNav, FDA Drug Labeling),
                Medivia analyzes medication profiles in real-time to detect
                dangerous combinations.
              </p>
              <p className="text-lg text-gray-600">
                Whether you're managing chronic conditions, recovering from
                surgery, or simply taking multiple vitamins and supplements,
                Medivia has your back.
              </p>
            </div>

            <div
              className="rounded-2xl p-8"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124,58,237,0.1), rgba(37,99,235,0.1))",
                border: "1px solid rgba(124,58,237,0.2)",
                minHeight: "300px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-around",
              }}
            >
              {[
                { num: "NIH", label: "RxNav API" },
                { num: "FDA", label: "Drug Labels" },
                { num: "Live", label: "Interaction Shield" },
                { num: "Free", label: "Always Open Source" },
              ].map((item, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-4xl font-black text-purple-600">
                    {item.num}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-20 md:py-32"
        style={{ background: "white" }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Get In Touch
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Our support team is
              here to help.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: "📧",
                title: "Email",
                value: "support@Medivia.health",
              },
              { icon: "📱", title: "Phone", value: "+1 (555) 123-4567" },
              {
                icon: "📍",
                title: "Address",
                value: "123 Medical Plaza, Healthcare City",
              },
            ].map((contact, idx) => (
              <div
                key={idx}
                className="p-8 text-center rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(124,58,237,0.02), rgba(37,99,235,0.02))",
                  border: "1px solid rgba(124,58,237,0.1)",
                }}
              >
                <div className="text-4xl mb-4">{contact.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">
                  {contact.title}
                </h3>
                <p className="text-gray-600">{contact.value}</p>
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto">
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                className="w-full px-6 py-3 rounded-xl"
                style={{
                  background: "white",
                  border: "1px solid rgba(0,0,0,0.1)",
                  outline: "none",
                }}
              />
              <input
                type="email"
                placeholder="Your Email"
                className="w-full px-6 py-3 rounded-xl"
                style={{
                  background: "white",
                  border: "1px solid rgba(0,0,0,0.1)",
                  outline: "none",
                }}
              />
              <textarea
                placeholder="Your Message"
                rows="5"
                className="w-full px-6 py-3 rounded-xl"
                style={{
                  background: "white",
                  border: "1px solid rgba(0,0,0,0.1)",
                  outline: "none",
                  resize: "none",
                }}
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-white transition-all"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                  boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
                }}
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-12"
        style={{
          background: "rgba(0,0,0,0.02)",
          borderTop: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">💊</span>
                <span className="font-black text-gray-900">Medivia</span>
              </div>
              <p className="text-gray-600 text-sm">
                Medication safety for everyone.
              </p>
            </div>

            {[
              {
                title: "Product",
                links: ["Features", "Security", "Pricing", "FAQ"],
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers", "Contact"],
              },
              {
                title: "Legal",
                links: ["Privacy", "Terms", "Compliance", "HIPAA"],
              },
            ].map((col, idx) => (
              <div key={idx}>
                <h4 className="font-bold text-gray-900 mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link, i) => (
                    <li key={i}>
                      <a
                        href="#"
                        className="text-gray-600 hover:text-purple-600 text-sm transition"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(0,0,0,0.05)",
              paddingTop: "2rem",
            }}
            className="text-center"
          >
            <p className="text-gray-600 text-sm">
              © 2026 Medivia. All rights reserved. | Made with ❤️ for your health by Shru and Naynu
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
