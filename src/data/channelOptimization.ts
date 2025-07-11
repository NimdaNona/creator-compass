export interface ChannelTemplate {
  niche: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  visualElements: string[];
  bioTemplate: string;
  keywords: string[];
}

export const channelTemplates: Record<string, ChannelTemplate> = {
  gaming: {
    niche: 'Gaming',
    colorScheme: {
      primary: '#E91E63',
      secondary: '#3F51B5',
      accent: '#00BCD4',
      background: '#0A0E27'
    },
    fonts: {
      heading: 'Russo One or Black Ops One',
      body: 'Roboto or Open Sans'
    },
    visualElements: [
      'Game controller icons',
      'Pixel art elements',
      'Neon/cyberpunk effects',
      'Achievement badges',
      'Console silhouettes'
    ],
    bioTemplate: '🎮 [Your Gaming Focus] Gamer | 🏆 [Achievement/Rank] | 🎯 [Content Schedule] | 💬 [Community Discord/Social] | 📧 [Business Email]',
    keywords: ['gaming', 'gameplay', 'walkthrough', 'lets play', 'gamer', 'streaming']
  },
  beauty: {
    niche: 'Beauty',
    colorScheme: {
      primary: '#F8BBD0',
      secondary: '#CE93D8',
      accent: '#FFD54F',
      background: '#FFF8E1'
    },
    fonts: {
      heading: 'Playfair Display or Didot',
      body: 'Montserrat or Lato'
    },
    visualElements: [
      'Makeup brush illustrations',
      'Glitter/sparkle overlays',
      'Floral patterns',
      'Marble textures',
      'Gold foil accents'
    ],
    bioTemplate: '✨ [Your Beauty Focus] | 💄 [Expertise Level] MUA | 🌟 [Posting Schedule] | 💌 Collabs: [Email] | 📍 [Location]',
    keywords: ['beauty', 'makeup', 'tutorial', 'skincare', 'cosmetics', 'glam']
  },
  tech: {
    niche: 'Technology',
    colorScheme: {
      primary: '#2196F3',
      secondary: '#00BCD4',
      accent: '#CDDC39',
      background: '#263238'
    },
    fonts: {
      heading: 'Orbitron or Exo 2',
      body: 'Source Sans Pro or IBM Plex Sans'
    },
    visualElements: [
      'Circuit board patterns',
      'Binary code backgrounds',
      'Geometric shapes',
      'Minimalist icons',
      'Gradient meshes'
    ],
    bioTemplate: '💻 [Tech Focus] Enthusiast | 🔧 [Specialization] | 📱 Reviews & Tutorials | 🚀 [Upload Schedule] | 📨 [Contact]',
    keywords: ['technology', 'tech review', 'gadgets', 'tutorial', 'unboxing', 'tech news']
  },
  travel: {
    niche: 'Travel',
    colorScheme: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
      background: '#F7F7F7'
    },
    fonts: {
      heading: 'Pacifico or Amatic SC',
      body: 'Quicksand or Comfortaa'
    },
    visualElements: [
      'Map illustrations',
      'Passport stamps',
      'Airplane icons',
      'Mountain silhouettes',
      'Wave patterns'
    ],
    bioTemplate: '✈️ [Countries] Countries | 🌍 [Travel Style] Traveler | 📸 [Content Focus] | 🗓️ [Post Schedule] | 📧 [Partnerships Email]',
    keywords: ['travel', 'wanderlust', 'adventure', 'explore', 'destination', 'travel guide']
  },
  food: {
    niche: 'Food & Cooking',
    colorScheme: {
      primary: '#FF6347',
      secondary: '#FFA500',
      accent: '#8BC34A',
      background: '#FFF9C4'
    },
    fonts: {
      heading: 'Lobster or Satisfy',
      body: 'Merriweather or Raleway'
    },
    visualElements: [
      'Kitchen utensil icons',
      'Food illustrations',
      'Recipe card layouts',
      'Herb/spice graphics',
      'Plate presentations'
    ],
    bioTemplate: '👨‍🍳 [Cuisine Type] Chef | 🍳 [Specialty] | 📖 [Recipe Frequency] | 🎥 [Video Schedule] | 📩 [Business Inquiries]',
    keywords: ['cooking', 'recipe', 'food', 'chef', 'cuisine', 'foodie']
  },
  fitness: {
    niche: 'Fitness & Health',
    colorScheme: {
      primary: '#4CAF50',
      secondary: '#FF5722',
      accent: '#FFC107',
      background: '#E8F5E9'
    },
    fonts: {
      heading: 'Bebas Neue or Impact',
      body: 'Roboto Condensed or Oswald'
    },
    visualElements: [
      'Dumbbell icons',
      'Heart rate lines',
      'Mountain peaks',
      'Running silhouettes',
      'Nutrition symbols'
    ],
    bioTemplate: '💪 [Certification] Trainer | 🏃 [Fitness Focus] | 🥗 [Additional Focus] | 📅 [Workout Schedule] | 💌 [Contact]',
    keywords: ['fitness', 'workout', 'health', 'exercise', 'training', 'wellness']
  },
  education: {
    niche: 'Educational',
    colorScheme: {
      primary: '#3F51B5',
      secondary: '#009688',
      accent: '#FFC107',
      background: '#ECEFF1'
    },
    fonts: {
      heading: 'Roboto Slab or Merriweather',
      body: 'Open Sans or Lato'
    },
    visualElements: [
      'Book icons',
      'Lightbulb graphics',
      'Chalkboard textures',
      'Pencil illustrations',
      'Graduation caps'
    ],
    bioTemplate: '📚 [Subject] Educator | 🎓 [Credentials] | 💡 [Content Type] | 📝 [Upload Schedule] | ✉️ [Contact]',
    keywords: ['education', 'learning', 'tutorial', 'course', 'teaching', 'study']
  },
  music: {
    niche: 'Music',
    colorScheme: {
      primary: '#9C27B0',
      secondary: '#E91E63',
      accent: '#00E676',
      background: '#1A1A1A'
    },
    fonts: {
      heading: 'Righteous or Bungee',
      body: 'Nunito or Poppins'
    },
    visualElements: [
      'Music notes',
      'Waveform graphics',
      'Vinyl records',
      'Instrument silhouettes',
      'Sound equalizers'
    ],
    bioTemplate: '🎵 [Genre] Artist | 🎸 [Instrument/Role] | 🎧 [Release Schedule] | 🎤 [Performance Info] | 📧 [Booking]',
    keywords: ['music', 'musician', 'artist', 'song', 'cover', 'original']
  },
  comedy: {
    niche: 'Comedy',
    colorScheme: {
      primary: '#FFD700',
      secondary: '#FF69B4',
      accent: '#00CED1',
      background: '#FFFACD'
    },
    fonts: {
      heading: 'Bangers or Fredoka One',
      body: 'Comic Neue or Varela Round'
    },
    visualElements: [
      'Speech bubbles',
      'Emoji patterns',
      'Comic book effects',
      'Spotlight graphics',
      'Laugh symbols'
    ],
    bioTemplate: '😂 [Comedy Style] Comedian | 🎭 [Content Type] | 🎪 [Upload Schedule] | 🎟️ [Shows/Tours] | 📧 [Bookings]',
    keywords: ['comedy', 'funny', 'humor', 'sketch', 'standup', 'entertainment']
  },
  art: {
    niche: 'Art & Design',
    colorScheme: {
      primary: '#FF1744',
      secondary: '#651FFF',
      accent: '#FFEA00',
      background: '#FAFAFA'
    },
    fonts: {
      heading: 'Abril Fatface or Playfair Display',
      body: 'Work Sans or Nunito Sans'
    },
    visualElements: [
      'Paint brush strokes',
      'Color palettes',
      'Pencil sketches',
      'Canvas textures',
      'Geometric patterns'
    ],
    bioTemplate: '🎨 [Art Style] Artist | ✏️ [Medium] | 🖼️ [Commission Status] | 📅 [Post Schedule] | 📧 [Contact]',
    keywords: ['art', 'artist', 'design', 'creative', 'artwork', 'illustration']
  }
};

export const platformOptimization = {
  twitch: {
    panels: [
      'About Me',
      'Schedule',
      'PC Specs/Equipment',
      'Social Media Links',
      'Donation/Tips',
      'Rules',
      'Discord Server'
    ],
    streamElements: [
      'Alerts (Follow, Sub, Donation)',
      'Chat overlay',
      'Recent events ticker',
      'Goal tracker',
      'Stream starting/ending screens'
    ],
    tips: [
      'Use consistent streaming schedule',
      'Create memorable emotes',
      'Engage with chat constantly',
      'Use channel point rewards creatively',
      'Host/raid other streamers'
    ]
  },
  youtube: {
    channelArt: {
      dimensions: '2560 x 1440 px',
      safeArea: '1546 x 423 px (center)',
      elements: [
        'Channel name/logo',
        'Upload schedule',
        'Social media handles',
        'Tagline/value proposition',
        'Visual brand elements'
      ]
    },
    playlists: [
      'New to Channel - Start Here',
      'Most Popular Videos',
      'Series/Categories',
      'Collaborations',
      'Behind the Scenes'
    ],
    tips: [
      'Create channel trailer',
      'Organize content into playlists',
      'Use end screens effectively',
      'Add channel watermark',
      'Customize channel URL'
    ]
  },
  tiktok: {
    profileOptimization: [
      'Clear profile picture',
      'Descriptive username',
      'Link to other platforms',
      'Highlight content niche',
      'Use relevant emojis'
    ],
    contentStrategy: [
      'Post 1-3 times daily',
      'Use trending sounds',
      'Jump on challenges early',
      'Create series content',
      'Engage with comments'
    ],
    tips: [
      'Film in vertical format',
      'Hook viewers in first 3 seconds',
      'Use text overlays',
      'Add captions',
      'Cross-promote on other platforms'
    ]
  }
};