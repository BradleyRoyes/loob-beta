
// MockMapData.ts

export type VisualView = 'Today' | 'ThisWeek' | 'AllTime';

export interface Node {
  id: string;
  lat: number;
  lon: number;
  label: string;
  type: string;
  details: string; // Description of the location
  contact: string; // Contact information
  visualType: VisualView; // Specifies the visual representation type
}
export const mockMapData: Node[] = [
  {
    id: 'berghain',
    lat: 52.511,
    lon: 13.438,
    label: 'Berghain',
    type: 'Venue',
    details: "Berlin's iconic techno club. Known for its strict door policy and pulsating beats.",
    contact: 'https://berghain.de/contact',
    visualType: 'Today',
  },
  {
    id: 'sisyphos',
    lat: 52.520,
    lon: 13.497, // Moved towards Friedrichshain
    label: 'Sisyphos',
    type: 'Venue',
    details: 'A sprawling venue with outdoor stages, bonfires, and a festival-like vibe.',
    contact: 'https://sisyphos-berlin.net/contact',
    visualType: 'ThisWeek',
  },
  {
    id: 'tresor',
    lat: 52.510,
    lon: 13.405, // Moved closer to Mitte
    label: 'Tresor',
    type: 'Venue',
    details: 'Industrial vibes in the heart of Berlin, showcasing cutting-edge techno.',
    contact: 'https://tresorberlin.com/contact',
    visualType: 'AllTime',
  },
  {
    id: 'kitkat',
    lat: 52.502,
    lon: 13.389, // Moved towards Kreuzberg
    label: 'KitKat Club',
    type: 'Venue',
    details: 'An open-minded club for electronic music lovers, famous for its dress code.',
    contact: 'https://kitkatclub.de/contact',
    visualType: 'Today',
  },
  {
    id: 'lending_gear_camera',
    lat: 52.503,
    lon: 13.350, // Schöneberg area
    label: 'Lending Gear - Camera',
    type: 'Gear for Lending',
    details: 'High-end cameras available for rental. Ideal for filmmakers and photographers.',
    contact: 'mailto:rentals@gearhub.com',
    visualType: 'Today',
  },
  {
    id: 'lending_gear_sound',
    lat: 52.522,
    lon: 13.378, // Prenzlauer Berg area
    label: 'Lending Gear - Sound Equipment',
    type: 'Gear for Lending',
    details: 'Top-notch audio equipment for events and recordings. Flexible rental terms.',
    contact: 'mailto:soundgear@gearhub.com',
    visualType: 'ThisWeek',
  },
  {
    id: 'artist_illustrator',
    lat: 52.540,
    lon: 13.409, // Pankow area
    label: 'Artist - Illustrator',
    type: 'Artist/Creator',
    details: 'Freelance illustrator specializing in custom branding, album covers, and comics.',
    contact: 'mailto:illustrator@artistryhub.com',
    visualType: 'AllTime',
  },
  {
    id: 'artist_photographer',
    lat: 52.515,
    lon: 13.375, // Near Tiergarten
    label: 'Artist - Photographer',
    type: 'Artist/Creator',
    details: "Event and portrait photography services. Capturing life's special moments.",
    contact: 'mailto:photography@captures.com',
    visualType: 'Today',
  },
  {
    id: 'event_designer_workshop',
    lat: 52.497,
    lon: 13.428, // Neukölln area
    label: 'Experience Designer - Workshop',
    type: 'Experience Designer',
    details: 'Custom workshops for corporate team-building and private events.',
    contact: 'mailto:workshops@experiencedesign.com',
    visualType: 'ThisWeek',
  },
  {
    id: 'custom_furniture_maker',
    lat: 52.495,
    lon: 13.457, // Treptow area
    label: 'Creator - Custom Furniture',
    type: 'Artist/Creator',
    details: 'Handcrafted furniture for modern and vintage interiors. Custom orders welcome.',
    contact: 'mailto:furniture@handcrafted.com',
    visualType: 'AllTime',
  },
  {
    id: 'revolver',
    lat: 52.530,
    lon: 13.407, // Moved to Gesundbrunnen area
    label: 'Revolver',
    type: 'Venue',
    details: 'A smaller, intimate venue blending underground culture with electronic music.',
    contact: 'mailto:info@revolverclub.com',
    visualType: 'Today',
  },
  {
    id: 'projector_rental',
    lat: 52.516,
    lon: 13.470, // Near Friedrichshain
    label: 'Lending Gear - Projector',
    type: 'Gear for Lending',
    details: 'High-quality projectors for presentations and events. Easy to set up.',
    contact: 'mailto:projectors@gearhub.com',
    visualType: 'ThisWeek',
  },
  {
    id: 'dj_performer',
    lat: 52.482,
    lon: 13.365, // Tempelhof
    label: 'Artist - DJ',
    type: 'Artist/Creator',
    details: 'Experienced DJ available for events. Genres include house, techno, and funk.',
    contact: 'mailto:bookings@djperformer.com',
    visualType: 'Today',
  },
  {
    id: 'pianist_classical_music',
    lat: 52.472,
    lon: 13.450, // Near Schöneweide
    label: 'Classical Pianist',
    type: 'Artist/Creator',
    details: 'Professional pianist available for weddings and corporate events.',
    contact: 'mailto:pianist@classicalmusic.com',
    visualType: 'AllTime',
  },
  {
    id: 'potsdam_sanssouci',
    lat: 52.400,
    lon: 13.040, // Potsdam area
    label: 'Sanssouci Palace',
    type: 'Venue',
    details: 'Baroque architecture and stunning gardens. Ideal for cultural tours.',
    contact: 'https://sanssouci-palace.de/contact',
    visualType: 'AllTime',
  },
  {
    id: 'cottbus_stadthalle',
    lat: 51.759,
    lon: 14.320, // Kept in Cottbus for variety
    label: 'Cottbus Stadthalle',
    type: 'Venue',
    details: 'Cultural events and performances in a grand, historic setting.',
    contact: 'mailto:info@stadthalle-cottbus.de',
    visualType: 'ThisWeek',
  },
];

export default mockMapData;
