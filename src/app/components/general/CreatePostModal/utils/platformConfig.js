import {
  FaInstagram,
  FaTwitter,
  FaFacebook,
  FaLinkedin,
  FaYoutube,
  FaPinterest,
} from 'react-icons/fa';
import { SiTiktok, SiThreads } from 'react-icons/si';

export const platformsConfig = [
  {
    name: 'Instagram',
    value: 'instagram',
    icon: FaInstagram,
    gradient: 'from-[#E4405F] via-[#DD2A7B] to-[#9C27B0]',
    requiresMedia: true,
    description: 'Posts, Reels & Stories',
    supportedFields: ['contentType', 'shareToFeed', 'collaborators', 'firstComment', 'userTags'],
  },
  {
    name: 'TikTok',
    value: 'tiktok',
    icon: SiTiktok,
    gradient: 'from-[#000000] to-[#69C9D0]',
    requiresMedia: true,
    description: 'Short-form videos',
    supportedFields: ['privacy_level', 'allow_comment', 'allow_duet', 'allow_stitch'],
  },
  {
    name: 'YouTube',
    value: 'youtube',
    icon: FaYoutube,
    gradient: 'from-[#FF0000] to-[#cc0000]',
    requiresMedia: true,
    description: 'Videos & Shorts',
    supportedFields: ['title', 'visibility', 'firstComment'],
  },
  {
    name: 'Facebook',
    value: 'facebook',
    icon: FaFacebook,
    gradient: 'from-[#1877F2] to-[#0c5ecf]',
    requiresMedia: false,
    description: 'Posts & Stories',
    supportedFields: ['contentType', 'pageId', 'firstComment'],
  },
  {
    name: 'Twitter',
    value: 'twitter',
    icon: FaTwitter,
    gradient: 'from-[#1DA1F2] to-[#0d8bd9]',
    requiresMedia: false,
    description: 'Tweets & Videos',
    supportedFields: ['disableLinkPreview', 'firstComment'],
  },
  {
    name: 'LinkedIn',
    value: 'linkedin',
    icon: FaLinkedin,
    gradient: 'from-[#0A66C2] to-[#004182]',
    requiresMedia: false,
    description: 'Professional content',
    supportedFields: ['firstComment', 'disableLinkPreview'],
  },
  {
    name: 'Threads',
    value: 'threads',
    icon: SiThreads,
    gradient: 'from-[#000000] to-[#666666]',
    requiresMedia: false,
    description: 'Text conversations',
    supportedFields: ['firstComment'],
  },
  {
    name: 'Pinterest',
    value: 'pinterest',
    icon: FaPinterest,
    gradient: 'from-[#E60023] to-[#bd001c]',
    requiresMedia: true,
    description: 'Pins & Boards',
    supportedFields: ['title', 'boardId'],
  },
];

export const getDefaultPlatformSpecificData = (platform) => {
  const defaults = {
    instagram: {
      contentType: null, // null or 'story'
      shareToFeed: true,
      collaborators: [],
      firstComment: '',
      userTags: [],
    },
    tiktok: {
      privacy_level: '',
      allow_comment: true,
      allow_duet: false,
      allow_stitch: false,
    },
    youtube: {
      title: '',
      visibility: 'public',
      firstComment: '',
    },
    facebook: {
      contentType: null,
      pageId: '',
      firstComment: '',
    },
    twitter: {
      disableLinkPreview: false,
      firstComment: '',
    },
    linkedin: {
      firstComment: '',
      disableLinkPreview: false,
    },
    threads: {
      firstComment: '',
    },
    pinterest: {
      title: '',
      boardId: '',
    },
  };

  return defaults[platform] || {};
};
