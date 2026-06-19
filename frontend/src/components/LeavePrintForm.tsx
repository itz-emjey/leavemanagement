import React from 'react';

interface LeavePrintFormProps {
  request: any; // Using any for simplicity here to accept the full request object
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export default function LeavePrintForm({ request: req }: LeavePrintFormProps) {
  // Safe extraction of values
  const name = req?.employee ? `${req.employee.firstName} ${req.employee.lastName}` : '';
  const position = req?.employee?.position || '';
  const department = req?.employee?.department?.name || '';
  const createdAt = req?.createdAt ? formatDate(req.createdAt) : '';
  const startDate = req?.startDate ? formatDate(req.startDate) : '';
  const endDate = req?.endDate ? formatDate(req.endDate) : '';
  const reason = req?.reason || '';
  
  const leaveName = (req?.leaveType?.name || '').toLowerCase();
  
  const isType = (matches: string[]) => matches.some(m => leaveName.includes(m));

  return (
    <div className="w-full max-w-4xl mx-auto bg-white text-black p-4 md:p-8 font-sans h-full">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 flex items-center justify-center bg-white print:w-[100px] print:h-[100px] print:block">
          {/* Logo - Uses standard img tag layout to ensure print rendering */}
          <img 
            src="/logo.png" 
            alt="SLRC Logo" 
            className="w-full h-full object-contain print:max-h-[100px]" 
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" stroke="black" stroke-width="2" fill="none"/><text x="50" y="55" font-size="14" text-anchor="middle" fill="black">LOGO</text></svg>';
            }} 
          />
        </div>
        
        <div className="flex-1 text-center pr-24 sm:pr-28 print:pr-[100px]">
          <h1 className="text-[1.1rem] sm:text-[1.35rem] font-bold uppercase tracking-wide print:text-[16pt]">
            San Lorenzo Ruiz College of Ormoc, Inc.
          </h1>
          <p className="text-[12px] sm:text-[13px] my-1 print:text-[10pt]">
            Brgy. San Pablo, Ormoc City
          </p>
          <h2 className="text-lg sm:text-xl font-bold uppercase mt-2 sm:mt-6 tracking-widest print:text-[14pt] print:mt-4">
            Request For Leave
          </h2>
        </div>
      </div>

      {/* HR Copy Spacer/Text */}
      <div className="mb-4">
        <span className="font-bold ml-10">HR Copy</span>
      </div>

      {/* Form Fields: Name & Date */}
      <div className="flex gap-4 mb-4 text-[13px] md:text-sm whitespace-nowrap">
        <div className="flex flex-1 items-end overflow-hidden">
          <label className="mr-2 mb-0.5">Name:</label>
          <div className="flex-1 border-b border-black relative h-6 min-w-[50px]">
             <span className="absolute bottom-0.5 left-2 font-medium truncate w-full">{name}</span>
          </div>
        </div>
        <div className="flex w-[35%] items-end overflow-hidden">
          <label className="mr-2 mb-0.5">Date:</label>
          <div className="flex-1 border-b border-black relative h-6 min-w-[50px]">
             <span className="absolute bottom-0.5 left-2 font-medium truncate w-full">{createdAt}</span>
          </div>
        </div>
      </div>

      {/* Form Fields: Position & Department */}
      <div className="flex gap-4 mb-4 text-[13px] md:text-sm whitespace-nowrap">
        <div className="flex flex-1 items-end overflow-hidden">
          <label className="mr-2 mb-0.5 uppercase">Position:</label>
          <div className="flex-1 border-b border-black relative h-6 min-w-[50px]">
             <span className="absolute bottom-0.5 left-2 font-medium truncate w-full">{position}</span>
          </div>
        </div>
        <div className="flex flex-1 items-end overflow-hidden">
          <label className="mr-2 mb-0.5">College/Department:</label>
          <div className="flex-1 border-b border-black relative h-6 min-w-[50px]">
             <span className="absolute bottom-0.5 left-2 font-medium truncate w-full">{department}</span>
          </div>
        </div>
      </div>

      {/* Kind of Leave Section */}
      <div className="mb-4 mt-6 text-[13px] md:text-sm">
        <label className="block mb-2">Kind of Leave:</label>
        
        {/* With / Without Pay */}
        <div className="flex ml-8 sm:ml-16 gap-4 sm:gap-8 mb-4">
          <div className="flex items-end flex-1 max-w-[220px]">
            <label className="mr-2 mb-0.5 whitespace-nowrap">With Pay:</label>
            <div className="flex-1 border-b border-black relative h-6 min-w-[40px]"></div>
          </div>
          <div className="flex items-end flex-1 max-w-[220px]">
            <label className="mr-2 mb-0.5 whitespace-nowrap">Without Pay:</label>
            <div className="flex-1 border-b border-black relative h-6 min-w-[40px]"></div>
          </div>
        </div>

        {/* Checkboxes Grid */}
        <div className="flex flex-wrap sm:flex-nowrap ml-8 sm:ml-16 gap-x-12 sm:gap-x-24 gap-y-4 mb-6">
          <div className="flex flex-col gap-1 w-40">
            {['Vacation', 'Maternity', 'Sick', 'Summer'].map(type => (
              <div key={type} className="flex justify-between items-center w-full group">
                <span className="cursor-pointer">{type}</span>
                <div className="w-[18px] h-[18px] border border-black flex items-center justify-center text-sm font-bold">
                   {isType([type.toLowerCase()]) ? '✓' : ''}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1 w-[260px]">
            {[
              { label: 'Emergency', matches: ['emergency', 'urgent'] },
              { label: 'Administrative/Educational', matches: ['admin', 'educational', 'training'] },
              { label: 'Leave of Absence', matches: ['absence', 'unpaid'] },
              { label: 'Compensatory Leave', matches: ['compensatory', 'offset'] }
            ].map(type => (
              <div key={type.label} className="flex justify-between items-center w-full group">
                <span className="cursor-pointer whitespace-nowrap pr-2">{type.label}</span>
                <div className="w-[18px] h-[18px] border border-black flex items-center justify-center flex-shrink-0 text-sm font-bold">
                   {isType(type.matches) ? '✓' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dates Fields */}
      <div className="flex items-end mb-4 gap-2 text-[13px] md:text-sm flex-wrap sm:flex-nowrap">
        <label className="mb-0.5 whitespace-nowrap">Date of Leave form:</label>
        <div className="w-32 border-b border-black relative h-6 text-center pt-1 font-medium">
          {startDate}
        </div>
        <span className="mb-0.5 mx-2">to</span>
        <div className="w-32 border-b border-black relative h-6 text-center pt-1 font-medium">
          {endDate}
        </div>
        <div className="flex-1 border-b border-black h-6 min-w-[40px]"></div>
      </div>

      {/* Reason Field */}
      <div className="flex mb-1 text-[13px] md:text-sm">
        <label className="mr-2 whitespace-nowrap mt-1">Reason:</label>
        <div className="flex-1">
          <div className="w-full border-b border-black relative h-6">
            <span className="absolute bottom-0.5 left-2 font-medium w-full block line-clamp-1">
              {reason.length <= 100 ? reason : reason.substring(0, 100)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex mb-8">
        <div className="flex-1 ml-[60px] border-b border-black relative h-6">
            <span className="absolute bottom-0.5 left-2 font-medium w-full block line-clamp-1">
              {reason.length > 100 ? reason.substring(100) : ''}
            </span>
        </div>
      </div>

      {/* Thick Horizontal Divider */}
      <div className="border-t-[3px] border-black my-4 w-full"></div>

      {/* Balances Section */}
      <div className="flex flex-wrap justify-between items-end mb-6 font-medium text-[13px]">
        <div className="flex flex-1 items-end min-w-[200px]">
          <label className="whitespace-nowrap mr-2">Balance Left this Leave:</label>
          <div className="flex-1 border-b border-black"></div>
        </div>
        <div className="flex flex-1 items-end sm:mx-4 min-w-[150px]">
          <label className="whitespace-nowrap mr-2">Vacation Leave:</label>
          <div className="flex-1 border-b border-black"></div>
        </div>
        <div className="flex flex-1 items-end min-w-[150px]">
          <label className="whitespace-nowrap mr-2">Sick Leave:</label>
          <div className="flex-1 border-b border-black"></div>
        </div>
      </div>

      {/* Signatures Full Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full border-collapse border border-black text-center text-[12px] md:text-[13px] table-fixed min-w-[600px]">
          <thead>
            <tr className="bg-white">
              <td className="border border-black px-2 py-1 text-left w-1/4">Requested By:</td>
              <td className="border border-black px-2 py-1 text-left w-1/4">Noted By:</td>
              <td className="border border-black px-2 py-1 text-left w-1/4">Verify By:</td>
              <td className="border border-black px-2 py-1 text-left w-1/4">Approved By:</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black h-[100px] align-bottom p-0 relative">
                {req?.employee?.signature && (
                  <div className="absolute top-2 left-0 w-full flex justify-center opacity-80 z-0">
                    <img src={req.employee.signature} alt="Signature" className="h-12 object-contain" />
                  </div>
                )}
                <div className="px-2 mb-[30px] font-bold uppercase truncate z-10 relative" title={name}>
                  {name}
                </div>
                <div className="border-t border-black px-2 py-1 truncate absolute bottom-0 w-full bg-white z-10">
                  Signiture over Printed Name
                </div>
              </td>
              <td className="border border-black h-[100px] align-bottom p-0 relative">
                <div className="border-t border-black px-2 py-1 absolute bottom-0 w-full bg-white">
                  Department Head
                </div>
              </td>
              <td className="border border-black h-[100px] align-bottom p-0 relative">
                <div className="px-2 mb-[30px] font-bold">
                  Maria Lourdes Q. Abelido
                </div>
                <div className="border-t border-black px-2 py-1 absolute bottom-0 w-full bg-white">
                  HR Personal
                </div>
              </td>
              <td className="border border-black h-[100px] align-bottom p-0 relative">
                 {/* Visual Approver logic */}
                 {req?.status === 'approved' && req?.approver && (
                  <div className="absolute top-2 left-0 w-full flex justify-center opacity-80 z-0">
                     {req.approver.signature ? (
                       <img src={req.approver.signature} alt="Signature" className="h-12 object-contain" />
                     ) : (
                       <span className="font-['Great_Vibes',_cursive] text-lg mt-2 text-indigo-800">{req.approver.firstName}</span>
                     )}
                  </div>
                 )}
                <div className="px-2 mb-[30px] font-bold z-10 relative">
                  Maria Josefina L. Herrera
                </div>
                <div className="border-t border-black px-2 py-1 block absolute bottom-0 w-full bg-white z-10">
                  OIC-School Administrator
                </div>
              </td>
            </tr>
            <tr>
              <td className="border border-black text-left px-2 py-1">Date:</td>
              <td className="border border-black text-left px-2 py-1">Date:</td>
              <td className="border border-black text-left px-2 py-1">Date:</td>
              <td className="border border-black text-left px-2 py-1">Date:</td>
            </tr>
          </tbody>
        </table>

        {/* Footer Notes Attached to Table */}
        <table className="w-full border-collapse border-l border-r border-b border-black text-left text-[11px] md:text-[12px] min-w-[600px]">
          <tbody>
            <tr>
              <td className="pt-1.5 pb-0.5 px-2">
                Note: The request must be filled-up ahead of the planned or scheduled leave.
              </td>
            </tr>
            <tr>
              <td className="pb-1.5 pt-0.5 px-2 pl-12">
                Accomplish in Duplicate: copies for HR and Employee.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
