
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const TeamMembers = () => {
  return (
    <div className="team-component bg-white py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
          Meet Our Team
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Team Member 1 - AYOMIDE */}
          <Card className="overflow-hidden">
            <CardHeader className="p-0">
              <div className="aspect-[4/3] relative">
                <img 
                  src="/lovable-uploads/727d4254-421c-4797-b7f4-b5a550fcfa3c.png" 
                  alt="Ayomide" 
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-2">AYOMIDE</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-700">Qualifications</h4>
                  <ul className="text-gray-600 list-disc list-inside space-y-1">
                    <li>3+ Years Teaching/Tutoring Experience</li>
                    <li>Qualified Teaching Status</li>
                    <li>PGCE in Primary Education</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Bio</h4>
                  <p className="text-gray-600">A teacher with a passion for helping children thrive academically and personally. With experience across EYFS to Year 6 and a special focus on Reception to Year 3, I provide tailored support in Maths and English that meets each child right where they are.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Member 2 - EYEZAK */}
          <Card className="overflow-hidden">
            <CardHeader className="p-0">
              <div className="aspect-[4/3] relative">
                <img 
                  src="/lovable-uploads/92b7a452-eeae-42d8-a51c-f2bf83195b56.png" 
                  alt="Eyezak" 
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-2">EYEZAK</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-700">Qualifications</h4>
                  <ul className="text-gray-600 list-disc list-inside space-y-1">
                    <li>5+ Years Teaching/Tutoring Experience</li>
                    <li>Qualified Teaching Status</li>
                    <li>PGCE in Secondary Education</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Bio</h4>
                  <p className="text-gray-600">I'm a passionate teacher who believes every student should have access to high quality learning. With a commitment to excellence, expertise in scaffolding, and a consistently optimistic outlook, I challenge my pupils to dream bigger, work harder, and believe in their ability to succeed.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeamMembers;
