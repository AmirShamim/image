import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const ContactPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'success', message: 'Message sent successfully! We\'ll get back to you soon.' });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfo = [
    { icon: '📧', title: 'Email', value: 'support@imagestudio.com', link: 'mailto:support@imagestudio.com' },
    { icon: '💬', title: 'Live Chat', value: 'Available 9am-5pm EST', link: null },
    { icon: '📍', title: 'Location', value: 'Remote-first company', link: null }
  ];

  return (
    <div className="min-h-screen bg-dark-900">
      <SEO
        title="Contact Us | ImageStudio"
        description="Get in touch with our team. We're here to help with any questions about ImageStudio."
        path="/contact"
      />
      <Header />

      <main className="pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Contact
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('contact.title')}</h1>
            <p className="text-zinc-400 text-lg">{t('contact.subtitle')}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-4">
              {contactInfo.map((item, index) => (
                <div key={index} className="glass-card-hover p-5">
                  <div className="text-2xl mb-3">{item.icon}</div>
                  <h3 className="text-white font-medium mb-1">{item.title}</h3>
                  {item.link ? (
                    <a href={item.link} className="text-primary hover:underline text-sm">
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-zinc-400 text-sm">{item.value}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2 glass-card p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-dark-600 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-primary focus:outline-none transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-dark-600 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-primary focus:outline-none transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-dark-600 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-primary focus:outline-none transition-colors"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={5}
                    className="w-full px-4 py-3 bg-dark-600 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-primary focus:outline-none transition-colors resize-none"
                    placeholder="Your message..."
                  />
                </div>

                {status.message && (
                  <div className={`p-4 rounded-xl text-sm font-medium ${
                    status.type === 'success' 
                      ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}>
                    {status.message}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-primary to-cyan-400 text-black font-semibold rounded-xl hover:shadow-glow hover:-translate-y-0.5 transition-all"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;

