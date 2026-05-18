import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Download, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SimpleEnquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  yearOfStudy: string;
  service: string;
  subject: string;
  message: string;
  timestamp: string;
}

const SimpleAdminEnquiries = () => {
  const [enquiries, setEnquiries] = useState<SimpleEnquiry[]>([]);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);

  const filteredEnquiries = useMemo(() => {
    const start = fromDate ? new Date(fromDate) : undefined;
    if (start) start.setHours(0, 0, 0, 0);
    const end = toDate ? new Date(toDate) : undefined;
    if (end) end.setHours(23, 59, 59, 999);

    return enquiries.filter((enquiry) => {
      const d = new Date(enquiry.timestamp);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }, [enquiries, fromDate, toDate]);

  useEffect(() => {
    console.log('🔍 Admin page loading...');
    const stored = localStorage.getItem('contactEnquiries');
    console.log('📊 Raw localStorage data:', stored);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('✅ Parsed enquiries:', parsed);
        setEnquiries(parsed);
      } catch (error) {
        console.error('❌ Error parsing localStorage:', error);
      }
    } else {
      console.log('📭 No enquiries found in localStorage');
    }
  }, []);

  const downloadCSV = () => {
    const headers = ['Date', 'Name', 'Email', 'Phone', 'Year of Study', 'Service', 'Subject', 'Message'];
    const csvContent = [
      headers.join(','),
      ...filteredEnquiries.map(enquiry => [
        new Date(enquiry.timestamp).toLocaleDateString(),
        enquiry.name,
        enquiry.email,
        enquiry.phone,
        enquiry.yearOfStudy,
        enquiry.service,
        enquiry.subject,
        `"${enquiry.message.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enquiries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">EZ Tuition - Contact Enquiries</h1>
          <Button onClick={downloadCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !fromDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? fromDate.toLocaleDateString() : <span>From date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !toDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? toDate.toLocaleDateString() : <span>To date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              onClick={() => {
                setFromDate(undefined);
                setToDate(undefined);
              }}
            >
              Clear filters
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEnquiries.map((enquiry) => (
                  <tr key={enquiry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(enquiry.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {enquiry.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <a
                        href={`mailto:${enquiry.email}`}
                        className="text-primary underline underline-offset-2 hover:opacity-80"
                        aria-label={`Email ${enquiry.name}`}
                      >
                        {enquiry.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {enquiry.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {enquiry.yearOfStudy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {enquiry.service}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {enquiry.subject}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {enquiry.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {enquiries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No enquiries yet
            </div>
          )}
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          Total enquiries: {enquiries.length}
        </div>
      </div>
    </div>
  );
};

export default SimpleAdminEnquiries;