import React, { useEffect } from 'react';

interface AdBannerProps {
  adSlot?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

export function AdBanner({ adSlot, format = 'auto', className = '' }: AdBannerProps) {
  useEffect(() => {
    try {
      // Initialize internal adsense process if loaded
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('Errors in adsense', err);
    }
  }, []);

  return (
    <div className={`w-full bg-gray-50 border border-dashed border-gray-300 rounded-xl flex items-center justify-center p-4 min-h-[100px] overflow-hidden ${className}`}>
        {adSlot ? (
          <ins className="adsbygoogle"
              style={{ display: 'block', width: '100%' }}
              // Replace this string with your real Google AdSense Publisher ID
              data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" 
              data-ad-slot={adSlot}
              data-ad-format={format}
              data-full-width-responsive="true"></ins>
        ) : (
          <div className="text-center text-gray-400">
            <span className="text-sm font-bold block mb-1">مساحة إعلانية (AdSense / إعلانك هنا)</span>
            <span className="text-[10px] uppercase tracking-widest block max-w-sm">سيتم عرض الإعلانات هنا بمجرد الموافقة على حسابك وربط كود أدسنس، أو يمكنك استخدامها لعرض إعلاناتك الخاصة كصورة ورابط بشكل مباشر.</span>
          </div>
        )}
    </div>
  );
}
