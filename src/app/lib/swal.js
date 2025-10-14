import Swal from 'sweetalert2';

// Custom styled SweetAlert2
const customSwal = Swal.mixin({
  customClass: {
    popup: 'rounded-2xl shadow-2xl',
    title: 'text-2xl font-bold text-gray-800',
    htmlContainer: 'text-gray-600',
    confirmButton: 'bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors',
    cancelButton: 'bg-gray-200 text-gray-800 px-6 py-2.5 rounded-lg hover:bg-gray-300 font-medium transition-colors ml-2',
    denyButton: 'bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 font-medium shadow-sm transition-colors',
  },
  buttonsStyling: false,
  showClass: {
    popup: 'animate-scale-in',
  },
  hideClass: {
    popup: 'animate-scale-out',
  },
});

// Success alert
export const showSuccess = (title, text) => {
  return customSwal.fire({
    icon: 'success',
    title: title,
    text: text,
    confirmButtonText: 'Got it!',
    timer: 3000,
    timerProgressBar: true,
  });
};

// Error alert
export const showError = (title, text) => {
  return customSwal.fire({
    icon: 'error',
    title: title,
    text: text,
    confirmButtonText: 'Okay',
  });
};

// Confirmation dialog
export const showConfirm = (title, text, confirmText = 'Yes, proceed', cancelText = 'Cancel') => {
  return customSwal.fire({
    title: title,
    text: text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });
};

// Loading alert
export const showLoading = (title = 'Processing...', text = 'Please wait') => {
  return Swal.fire({
    title: title,
    text: text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// Close any open alert
export const closeSwal = () => {
  Swal.close();
};

export default customSwal;
