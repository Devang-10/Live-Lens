import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] py-12 px-6 text-center">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold tracking-wide uppercase mb-4">
          <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
          Live Fact-Checking
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight">
          Read truth, <br className="hidden md:block"/>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600">
            not fiction.
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-500 font-light max-w-2xl mx-auto leading-relaxed">
          Instantly scan articles for factual inaccuracies, or join a community of truth-seekers dissecting modern media.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12 pt-8">
          <Link 
            to="/workplace"
            className="group flex items-center justify-between w-full sm:w-auto gap-6 bg-gray-900 text-white px-8 py-5 rounded-2xl hover:bg-gray-800 hover:scale-[1.02] transition-all shadow-xl"
          >
            <div className="flex flex-col items-start gap-1 text-left">
              <span className="font-semibold text-lg flex items-center gap-2">
                <Search className="w-5 h-5 text-yellow-400" />
                Workplace
              </span>
              <span className="text-gray-400 text-sm">Scan text privately</span>
            </div>
            <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link 
            to="/community"
            className="group flex items-center justify-between w-full sm:w-auto gap-6 bg-white outline outline-2 outline-gray-200 text-gray-900 px-8 py-5 rounded-2xl hover:outline-gray-300 hover:bg-gray-50 hover:scale-[1.02] transition-all shadow-sm"
          >
            <div className="flex flex-col items-start gap-1 text-left">
              <span className="font-semibold text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Community
              </span>
              <span className="text-gray-500 text-sm">Discuss & share truths</span>
            </div>
            <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );
}
