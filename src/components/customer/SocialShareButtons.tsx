import React from 'react';
import { Facebook, Twitter, Link as LinkIcon } from 'lucide-react';

interface SocialShareButtonsProps {
  productUrl: string;
  productName: string;
}

const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ productUrl, productName }) => {
  const encodedUrl = encodeURIComponent(productUrl);
  const encodedText = encodeURIComponent(`Hãy xem sản phẩm này: ${productName}`);

  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(productUrl)
      .then(() => alert('Đã sao chép liên kết!'))
      .catch(err => console.error('Không thể sao chép:', err));
  };

  return (
    <div className="flex items-center space-x-3">
      <span className="font-semibold text-gray-700">Chia sẻ:</span>
      <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600 transition-colors">
        <Facebook size={22} />
      </a>
      <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 transition-colors">
        <Twitter size={22} />
      </a>
      <button onClick={copyToClipboard} className="text-gray-500 hover:text-indigo-600 transition-colors" title="Sao chép liên kết">
        <LinkIcon size={22} />
      </button>
    </div>
  );
};

export default SocialShareButtons;
