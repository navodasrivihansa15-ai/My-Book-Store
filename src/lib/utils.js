export const formatPrice = (price) => {
  const num = Number(price) || 0;
  return 'LKR ' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
