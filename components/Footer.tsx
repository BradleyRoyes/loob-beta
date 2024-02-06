const Footer = () => {
  return (
    <footer className="chatbot-text-tertiary flex justify-between text-sm mt-6">
      <a
        className=" vercel-link flex h-8 w-max flex-none items-center justify-center border rounded-md text-xs"
        aria-label="Create with seks"
        href="https://seks.design"
      >
        <span className="px-3">▲</span>
        <hr className="h-full border-r" />
        <span className="px-3">seks</span>
      </a>
      <div className="ml-auto flex flex-row items-center">
        <span className="mr-1">Powered by</span>
        {/* <svg><svg/> */}
      </div>
    </footer>
  );
};

export default Footer;
