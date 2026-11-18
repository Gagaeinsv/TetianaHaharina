'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Modal from '@/components/Modal';
import SiteHeader from '@/components/sections/SiteHeader';
import HeroSection from '@/components/sections/HeroSection';
import PrinciplesSection from '@/components/sections/PrinciplesSection';
import AboutSection from '@/components/sections/AboutSection';
import SpecializationsSection from '@/components/sections/SpecializationsSection';
import ServicesSection from '@/components/sections/ServicesSection';
import HowItWorksSection from '@/components/sections/HowItWorksSection';
import EmpathySection from '@/components/sections/EmpathySection';
import ReviewsSection from '@/components/sections/ReviewsSection';
import BookingSection from '@/components/sections/BookingSection';
import FaqSection from '@/components/sections/FaqSection';
import SiteFooter from '@/components/sections/SiteFooter';
import QuickContactWidget from '@/components/sections/QuickContactWidget';
import { getFallbackPayload } from '@/lib/defaultData';

export default function HomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [legalModal, setLegalModal] = useState({ isOpen: false, title: '', content: '' });
  const [certModal, setCertModal] = useState({ isOpen: false, imgPath: '', title: '' });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/content');
        const json = await res.json();
        if (active && json.success) {
          setData(json);
          if (json.services?.length > 0) setSelectedServiceId(json.services[0].id);
        } else if (active) {
          const fb = getFallbackPayload();
          setData(fb);
          setSelectedServiceId(fb.services[0].id);
        }
      } catch {
        if (active) {
          const fb = getFallbackPayload();
          setData(fb);
          setSelectedServiceId(fb.services[0].id);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const openLegalDoc = (type) => {
    const doc = data?.legalDocs?.find((d) => d.type === type);
    if (doc) {
      setLegalModal({ isOpen: true, title: doc.title, content: doc.content });
    }
  };

  const scrollToBooking = (serviceId) => {
    if (serviceId) setSelectedServiceId(serviceId);
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading || !data) {
    return (
      <div className="site-loader">
        <div className="spinner" />
        <p>Завантажуємо простір турботи...</p>
      </div>
    );
  }

  const { profile, services = [] } = data;
  const paymentSettings = profile?.paymentSettings;

  return (
    <div className="gagarina-site">
      <SiteHeader profileName={profile.name} />
      <HeroSection profile={profile} />
      <PrinciplesSection />
      <AboutSection profile={profile} />
      <SpecializationsSection
        specializations={profile.specializations}
        onSelectBooking={scrollToBooking}
      />
      <ServicesSection services={services} onSelectBooking={scrollToBooking} />
      <HowItWorksSection />
      <EmpathySection />
      <ReviewsSection
        onOpenImage={(imgPath, title) =>
          setCertModal({ isOpen: true, imgPath, title })
        }
      />
      <BookingSection
        profile={profile}
        services={services}
        paymentSettings={paymentSettings}
        selectedServiceId={selectedServiceId}
        onSelectService={setSelectedServiceId}
      />
      <FaqSection />
      <SiteFooter
        profile={profile}
        paymentSettings={paymentSettings}
        onOpenLegalDoc={openLegalDoc}
      />
      <QuickContactWidget profile={profile} />

      <Modal
        isOpen={legalModal.isOpen}
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
        title={legalModal.title}
      >
        <div className="legal-content-pre">{legalModal.content}</div>
      </Modal>

      <Modal
        isOpen={certModal.isOpen}
        onClose={() => setCertModal({ ...certModal, isOpen: false })}
        title={certModal.title}
      >
        <div className="cert-modal-body">
          {certModal.imgPath && (
            <Image
              src={certModal.imgPath}
              alt={certModal.title}
              width={900}
              height={900}
              className="cert-large-img"
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
