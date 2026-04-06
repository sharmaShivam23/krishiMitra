export const KRISHI_SARTHI_START_EVENT = 'krishisarthi:start';

export interface KrishiSarthiPageContext {
  module?: string;
  route?: string;
  summary?: string;
}

export interface KrishiSarthiStartDetail {
  prompt?: string;
  context?: KrishiSarthiPageContext;
  autoSend?: boolean;
}

export const requestKrishiSarthi = (detail: KrishiSarthiStartDetail = {}) => {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<KrishiSarthiStartDetail>(KRISHI_SARTHI_START_EVENT, { detail })
  );
};
