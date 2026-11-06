export const site = {
  name: 'Maithilok',
  hindiName: 'मैथिल लोक',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100',
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '+91 7667213605',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'karnmayank07@gmail.com',
  whatsapp: (process.env.NEXT_PUBLIC_CONTACT_PHONE || '+91 7667213605').replace(/\D/g, ''),
  address: {
    line1: process.env.NEXT_PUBLIC_ADDRESS_LINE1 || 'Darbhanga',
    city: 'Darbhanga',
    state: 'Bihar',
    pin: process.env.NEXT_PUBLIC_ADDRESS_PIN || '846004',
    country: 'India',
  },
};
export const addressLine = () =>
  [
    site.address.line1 !== site.address.city ? site.address.line1 : '',
    `${site.address.city}, ${site.address.state} ${site.address.pin}`,
    site.address.country,
  ]
    .filter(Boolean)
    .join(', ');
export const telHref = () => `tel:${site.phone.replace(/\s/g, '')}`;
