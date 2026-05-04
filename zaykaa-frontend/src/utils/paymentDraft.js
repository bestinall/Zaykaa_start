const PAYMENT_DRAFT_KEY = 'zaykaa-payment-draft';

const canUseStorage = () => typeof window !== 'undefined' && Boolean(window.sessionStorage);

export const getPaymentDraft = () => {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const rawDraft = window.sessionStorage.getItem(PAYMENT_DRAFT_KEY);
    return rawDraft ? JSON.parse(rawDraft) : null;
  } catch (error) {
    return null;
  }
};

export const savePaymentDraft = (draft) => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.sessionStorage.setItem(PAYMENT_DRAFT_KEY, JSON.stringify(draft));
  } catch (error) {
    // Ignore storage failures for the mock flow.
  }
};

export const clearPaymentDraft = () => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(PAYMENT_DRAFT_KEY);
  } catch (error) {
    // Ignore storage failures for the mock flow.
  }
};
