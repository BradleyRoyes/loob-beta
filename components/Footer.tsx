const Footer = () => {
  return (
    <footer className="chatbot-text-tertiary flex justify-between text-sm mt-6">
      <a
        className=" vercel-link flex h-8 w-max flex-none items-center justify-center border rounded-md text-xs"
        aria-label="Create with seks"
        href="https://seks.design"
        target="_blank"
      >
        <span className="px-3">▲</span>
        <hr className="h-full border-r" />
        <span className="px-3">seks</span>
      </a>
      <div className="ml-auto flex flex-row items-center">
        <span className="mr-1">Powered by</span>
          <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
             viewBox="0 0 595.3 841.9" style="enable-background:new 0 0 595.3 841.9;" xml:space="preserve">
            <style type="text/css">
              .st0{fill:none;stroke:#000000;stroke-width:9;stroke-miterlimit:10;}
              .st1{fill:none;stroke:#000000;stroke-width:16;stroke-miterlimit:10;}
            </style>
            <path class="st0" d="M286.6,280.3l-3.7-72.2c0,0-61.2,20.3-74,32.2c-20.2,18.9-12.3,43.8-9.6,63.6c2.7,19.8,21.8,79.6-33.9,79.5
              c-57.6-0.1-53.4-70.2-53.4-70.2"/>
            <path class="st0" d="M69.8,485.8h135.6c0,0-3.6-72.6-70.2-72.6C69.8,413.2,69.8,485.8,69.8,485.8z"/>
            <path class="st0" d="M69.8,488.9c0,0,0,43.9,32,67.7c50.4,37.4,102.6-15.5,102.6-15.5v28.7"/>
            <polyline class="st1" points="245.2,280.3 245.2,421.4 245.2,600 "/>
            <path class="st1" d="M364.3,339.6c0,0-48.1,60.4-108.7,81.8l184,173.4"/>
            <path class="st0" d="M478.1,384.5c0,0-9.6-23.3-49-23.3c-39,0-54.2,18.4-54.2,35.9c0,17.5,15.6,30.1,53.5,31.7
              c69.8,2.9,61.3,73.1,0.9,73.1c-54.5,0-60.3-28.1-60.3-28.1"/>
          </svg>
      </div>
    </footer>
  );
};

export default Footer;
