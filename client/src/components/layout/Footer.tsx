import { Link } from 'wouter';
import { Facebook, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">CareerConnect</h3>
            <p className="text-gray-300 text-sm">
              Find your next career opportunity with our comprehensive job board and application management system.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">For Job Seekers</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><Link href="/" className="hover:text-white">Browse Jobs</Link></li>
              <li><Link href="/" className="hover:text-white">Create Account</Link></li>
              <li><Link href="/" className="hover:text-white">Career Resources</Link></li>
              <li><Link href="/" className="hover:text-white">FAQ</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">For Employers</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><Link href="/employee" className="hover:text-white">Post a Job</Link></li>
              <li><Link href="/" className="hover:text-white">Pricing</Link></li>
              <li><Link href="/" className="hover:text-white">Resources</Link></li>
              <li><Link href="/" className="hover:text-white">Support</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>Email: info@careerconnect.com</li>
              <li>Phone: (555) 123-4567</li>
              <li>Address: 123 Main Street, Suite 100, City, State 12345</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-300 text-sm">© {new Date().getFullYear()} CareerConnect. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" aria-label="Facebook" className="text-gray-300 hover:text-white">
              <Facebook className="h-6 w-6" />
            </a>
            <a href="#" aria-label="Twitter" className="text-gray-300 hover:text-white">
              <Twitter className="h-6 w-6" />
            </a>
            <a href="#" aria-label="LinkedIn" className="text-gray-300 hover:text-white">
              <Linkedin className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
