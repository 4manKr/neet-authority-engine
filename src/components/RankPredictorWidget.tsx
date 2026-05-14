'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LeadGateModal } from '@/components/LeadGateModal';
import Link from 'next/link';

export function RankPredictorWidget() {
  const [rank, setRank] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  
  const [isLeadGateOpen, setIsLeadGateOpen] = useState(false);
  const [isReportUnlocked, setIsReportUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);
    setError(null);
    setIsReportUnlocked(false);

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rank, category })
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
      } else {
        setError(data.error || 'Failed to predict. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-blue-50">
        <h3 className="text-2xl font-bold text-blue-900 mb-6 text-center">Predict Your Medical College</h3>
        <form onSubmit={handlePredict} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rank">NEET Rank</Label>
              <Input 
                id="rank" 
                placeholder="e.g. 15000" 
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                required
                type="number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select 
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="" disabled>Select Category</option>
                <option value="UR">Unreserved (UR)</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 h-12 text-lg mt-4">
            {loading ? 'Analyzing historical cutoffs...' : 'Predict Colleges'}
          </Button>
          {error && (
            <p className="text-sm text-red-600 text-center mt-2">{error}</p>
          )}
        </form>
      </div>

      {/* Results Section */}
      {results && (
        <div className="mt-8 space-y-6">
          <h4 className="text-xl font-bold text-gray-800 text-center">
            {results.length > 0 ? `We found ${results.length} probable colleges for you!` : 'No colleges found for this rank/category combination.'}
          </h4>
          
          <div className="grid gap-4">
            {(isReportUnlocked ? results : results.slice(0, 3)).map((item, idx) => (
              <div key={item.college._id || idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h5 className="font-bold text-lg text-blue-900">{item.college.name}</h5>
                  <p className="text-sm text-gray-500">{item.college.location.city}, {item.college.location.state}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium mb-1">
                    Chance: High
                  </span>
                  <p className="text-xs text-gray-500">
                    Past Cutoff: <strong className="text-gray-900">{item.cutoffDetails.closingRank}</strong> ({item.cutoffDetails.year})
                  </p>
                </div>
                <Link href={`/college/${item.college.slug}`}>
                  <Button variant="outline" size="sm">View Details</Button>
                </Link>
              </div>
            ))}
          </div>

          {!isReportUnlocked && results.length > 3 && (
            <div className="bg-gradient-to-b from-transparent to-white/80 pb-10 pt-4 text-center">
              <Button 
                onClick={() => setIsLeadGateOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg px-8 py-6 text-lg font-bold animate-pulse"
              >
                Unlock {results.length - 3} More Colleges & Detailed Report
              </Button>
            </div>
          )}
        </div>
      )}

      <LeadGateModal 
        isOpen={isLeadGateOpen} 
        onOpenChange={setIsLeadGateOpen} 
        onSuccess={() => setIsReportUnlocked(true)}
        neetRank={Number(rank)}
        category={category}
      />
    </div>
  );
}
