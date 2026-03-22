import type { Inquiry } from './admin';

function xmlEscape(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(value: string | null | undefined) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildWorksheet(name: string, columns: string[], rows: string[][]) {
  const headerXml = columns
    .map(column => `<Cell ss:StyleID="header"><Data ss:Type="String">${xmlEscape(column)}</Data></Cell>`)
    .join('');

  const rowsXml = rows
    .map(
      row =>
        `<Row>${row
          .map(cell => `<Cell><Data ss:Type="String">${xmlEscape(cell)}</Data></Cell>`)
          .join('')}</Row>`,
    )
    .join('');

  return `<Worksheet ss:Name="${xmlEscape(name)}"><Table><Row>${headerXml}</Row>${rowsXml}</Table></Worksheet>`;
}

export function exportInquiriesWorkbook(inquiries: Inquiry[]) {
  const applications = inquiries.filter(item => item.context === 'career');
  const contacts = inquiries.filter(item => item.context === 'contact');
  const projects = inquiries.filter(item => item.context === 'project');

  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="header">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#F2ECE0" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 ${buildWorksheet(
   'Applications',
   ['Name', 'Email', 'Status', 'Position', 'Phone', 'Country', 'City', 'Experience', 'Availability', 'Created At'],
   applications.map(item => [
     item.name || `${item.first_name || ''} ${item.last_name || ''}`.trim(),
     item.email,
     item.status,
     item.position || '',
     item.phone || '',
     item.country || '',
     item.city || '',
     item.experience || '',
     item.availability || '',
     formatDate(item.created_at),
   ]),
 )}
 ${buildWorksheet(
   'Inquiries',
   ['Name', 'Email', 'Status', 'Organization', 'Message', 'Created At'],
   contacts.map(item => [
     item.name,
     item.email,
     item.status,
     item.organization || '',
     item.message || '',
     formatDate(item.created_at),
   ]),
 )}
 ${buildWorksheet(
   'Project Clients',
   ['Name', 'Email', 'Status', 'Organization', 'Service', 'Role', 'Engagement Model', 'Data Volume', 'Created At'],
   projects.map(item => [
     item.name,
     item.email,
     item.status,
     item.organization || '',
     item.service || '',
     item.role || '',
     item.engagement_model || '',
     item.data_volume || '',
     formatDate(item.created_at),
   ]),
 )}
</Workbook>`;

  const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `lifewood-inquiries-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
