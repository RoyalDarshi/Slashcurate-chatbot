const Loader = ({ text }: { text: string }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-70 backdrop-blur-lg z-50">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 text-white text-xl font-bold animate-pulse">{text}</p>
    </div>
  );
};

export default Loader;
