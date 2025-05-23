import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start">
            <Link to="/" className="text-green-600 font-bold">
              🚮 Garbage Watch
            </Link>
          </div>
          <div className="mt-4 md:mt-0">
            <p className="text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Garbage Watch. A civic tech proof-of-concept.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-6 justify-center md:justify-end">
            <Link to="/admin/login" className="text-gray-400 hover:text-gray-500">
              Admin
            </Link>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              Privacy
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 