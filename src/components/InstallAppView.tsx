import React, { useState, useEffect } from 'react';
import { 
  AppWindow, 
  Download, 
  Smartphone, 
  CheckCircle, 
  ShieldCheck, 
  Sparkles,
  Info,
  CircleArrowDown,
  Globe,
  Share2,
  Copy,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

export default function InstallAppView() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installationActive, setInstallationActive] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    // 1. Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 2. Check standalone display mode to see if it's already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("Installation is fully supported through your browser menu. Please follow the instructions below!");
      return;
    }
    
    // Show the browser install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User installation decision: ${outcome}`);
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const copyAppURL = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Introduction Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5E7E9] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D5F5E3] rounded-full filter blur-2xl opacity-40 -mr-10 -mt-10 pointer-events-none" />
        
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#E8F8F5] text-[#196F3D] rounded-2xl">
            <Smartphone className="h-8 w-8" />
          </div>
          <div className="flex-1 space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#EBF5FB] text-[#2980B9] rounded-md text-[10px] font-bold tracking-widest uppercase">
              Official PWA Install Hub
            </span>
            <h3 className="text-xl font-bold text-[#2C3E50]">Get Phone App • موبائل ایپ حاصل کریں</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Install the official Shahid &amp; Sons ledger app on your mobile device. Because it is a secure, modern Progressive Web App (PWA), you do not need an insecure, heavy APK download. 
            </p>
          </div>
        </div>

        {/* Urdu explanation section */}
        <div className="mt-4 p-4 bg-[#F4F6F7] rounded-xl border border-dashed border-[#BDC3C7] text-right" dir="rtl">
          <p className="text-xs font-bold text-[#145A32] mb-1">محترم شاہد صاحب اور آپ کی ٹیم کیلئے اہم معلومات:</p>
          <p className="text-[13px] text-gray-700 leading-relaxed">
            یہ ایک جدید اور تیز ترین <strong>Progressive Web App (PWA)</strong> ہے جو آپ کے موبائل میں بالکل ایک عام ڈاؤن لوڈ شدہ ایپ (APK) کی طرح کام کرتی ہے۔ آپ کو غیر محفوظ اور بھاری اے پی کے (APK) فائل ڈاؤن لوڈ کرنے کی کوئی ضرورت نہیں ہے۔ اسے آپ ایک کلک میں گوگل کروم یا سفاری کے ذریعے انسٹال کر کے اپنے موبائل کی ہوم اسکرین پر لاسکتے ہیں۔
          </p>
        </div>
      </div>

      {/* Primary Install Banner Action */}
      <div className="bg-gradient-to-r from-[#196F3D] to-[#114B21] text-white rounded-3xl p-6 shadow-md border border-[#145A32]">
        <div className="max-w-md mx-auto text-center space-y-5">
          <div className="mx-auto w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
            <Download className="h-8 w-8 text-[#D5F5E3]" />
          </div>

          <div className="space-y-2">
            <h4 className="text-2xl font-black tracking-tight">
              {isInstalled ? "Successfully Installed!" : "Install App on Phone"}
            </h4>
            <p className="text-xs text-[#D5F5E3]/90 font-medium">
              {isInstalled 
                ? "Shahid & Sons CashBook is running beautifully as an app!" 
                : "روزانہ کیش بک کھاتہ کی موبائل ایپ ابھی ڈاؤن لوڈ اور انسٹال کریں"}
            </p>
          </div>

          {isInstalled ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl text-sm font-bold">
              <CheckCircle className="h-5 w-5 text-[#2ECC71]" />
              App is Installed on your Home Screen!
            </div>
          ) : isInstallable ? (
            <button
              onClick={handleInstallClick}
              className="w-full bg-[#F1C40F] hover:bg-[#F39C12] text-[#145A32] font-black py-4 px-6 rounded-2xl shadow-lg transition-transform hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2 "
            >
              <Download className="h-5 w-5 stroke-[2.5]" />
              INSTALL MOBILE APP (انسٹال کریں)
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-white/10 rounded-xl p-3 text-xs text-left leading-relaxed text-[#D5F5E3]">
                💡 <strong>Android Custom Note:</strong> Your current browser restricts direct 1-click install. You can easily install this by clicking the browser's menu (3 dots) in Chrome and choosing <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
              </div>
              <button
                onClick={copyAppURL}
                className="w-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-[#D5F5E3]" />
                    App Link Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy App URL link to open in Chrome (لنک کاپی کریں)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Platform Instructions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Android / Chrome Manual Steps */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7E9] shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#196F3D]">
              <div className="w-8 h-8 rounded-lg bg-[#E8F8F5] flex items-center justify-center text-xs font-bold">1</div>
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-gray-700">Android Instructions (کروم کیلئے)</h4>
            </div>

            <div className="space-y-3.5 pl-1" dir="rtl">
              <div className="flex gap-2 text-right">
                <div className="text-emerald-700 min-w-4 font-bold">1.</div>
                <div className="text-xs text-gray-600">گوگل کروم (Chrome) براؤزر میں اس لنک کو کھولیں۔</div>
              </div>
              <div className="flex gap-2 text-right">
                <div className="text-emerald-700 min-w-4 font-bold">2.</div>
                <div className="text-xs text-gray-600">اوپر سیدھے ہاتھ پر موجود تین ڈاٹ یا مینیو کا بٹن <strong>(፧)</strong> دبائیں۔</div>
              </div>
              <div className="flex gap-2 text-right">
                <div className="text-emerald-700 min-w-4 font-bold">3.</div>
                <div className="text-xs text-gray-600">مینیو میں <strong>"Install app"</strong> یا <strong>"Add to Home screen"</strong> پر کلک کریں۔</div>
              </div>
              <div className="flex gap-2 text-right">
                <div className="text-emerald-700 min-w-4 font-bold">4.</div>
                <div className="text-xs text-gray-600">تصدیق (confirm) کیجئے اور چند سیکنڈ میں آئیکون ہوم اسکرین پر آ جائے گا۔</div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Better with Chrome</span>
            <span className="px-2.5 py-0.5 bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-bold rounded-full">Recommended</span>
          </div>
        </div>

        {/* iOS / iPhone Safari Manual Steps */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7E9] shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#196F3D]">
              <div className="w-8 h-8 rounded-lg bg-[#E8F8F5] flex items-center justify-center text-xs font-bold">2</div>
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-gray-700">iPhone / Safari (آئی فون کیلئے)</h4>
            </div>

            <div className="space-y-3.5 pl-1" dir="rtl">
              <div className="flex gap-2 text-right">
                <div className="text-emerald-700 min-w-4 font-bold">1.</div>
                <div className="text-xs text-gray-600">آئی فون پر سفاری (Safari) براؤزر کے ذریعے اس لنک کو کھولیں۔</div>
              </div>
              <div className="flex gap-2 text-right">
                <div className="text-emerald-700 min-w-4 font-bold">2.</div>
                <div className="text-xs text-gray-600">نیچے موجود شیئر بٹن <strong>(Share Icon)</strong> دبائیں۔ (ڈبہ جس کے اوپر تیر کا نشان ہے)۔</div>
              </div>
              <div className="flex gap-2 text-right">
                <div className="text-emerald-700 min-w-4 font-bold">3.</div>
                <div className="text-xs text-gray-600">نیچے اسکرول کریں اور <strong>"Add to Home Screen"</strong> پر کلک کریں۔</div>
              </div>
              <div className="flex gap-2 text-right">
                <div className="text-emerald-700 min-w-4 font-bold">4.</div>
                <div className="text-xs text-gray-600">اوپر دائیں ہاتھ پر <strong>Add</strong> کا بٹن دبائیں۔ اب کیش بک آپ کے ہوم اسکرین پر محفوظ ہو چکی ہے۔</div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Safari Device Setup</span>
            <span className="px-2.5 py-0.5 bg-[#EAEDED] text-[#7F8C8D] text-[10px] font-bold rounded-full">iOS Method</span>
          </div>
        </div>
      </div>

      {/* PWA Benefits Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5E7E9] shadow-sm space-y-4">
        <h4 className="text-sm font-black text-[#2C3E50] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-[#F1C40F]" />
          Key Features of this PWA vs Traditional APK File
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#F9F9F9] rounded-xl flex flex-col space-y-2">
            <ShieldCheck className="h-6 w-6 text-[#196F3D]" />
            <h5 className="font-bold text-xs text-gray-700 uppercase">100% Safe &amp; Secure</h5>
            <p className="text-xs text-gray-500 leading-relaxed">
              Unlike unknown static APK files, PWAs run inside a safe sandbox with zero risk of malware or viruses.
            </p>
          </div>

          <div className="p-4 bg-[#F9F9F9] rounded-xl flex flex-col space-y-2">
            <Info className="h-6 w-6 text-[#196F3D]" />
            <h5 className="font-bold text-xs text-gray-700 uppercase">Instant Updates</h5>
            <p className="text-xs text-gray-500 leading-relaxed">
              No need to manually download new APK files. Whenever there are improvements, your app updates automatically.
            </p>
          </div>

          <div className="p-4 bg-[#F9F9F9] rounded-xl flex flex-col space-y-2">
            <Globe className="h-6 w-6 text-[#196F3D]" />
            <h5 className="font-bold text-xs text-gray-700 uppercase">Persistent Offline</h5>
            <p className="text-xs text-gray-500 leading-relaxed">
              All records and transactions are saved securely using local caches and storage, working fully offline without an active internet connection.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
