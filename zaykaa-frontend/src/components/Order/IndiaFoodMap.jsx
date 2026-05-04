import React, { useEffect, useMemo, useRef, useState } from 'react';

const STATE_ID_BY_NAME = {
  'Andhra Pradesh': 'ap',
  'Arunachal Pradesh': 'ar',
  Assam: 'as',
  Bihar: 'br',
  Chandigarh: 'ch',
  Chhattisgarh: 'ct',
  'Dadra & Nagar Haveli': 'dn',
  Daman: 'daman',
  Delhi: 'dl',
  Diu: 'diu',
  Goa: 'ga',
  Gujarat: 'gj',
  Haryana: 'hr',
  'Himachal Pradesh': 'hp',
  'Jammu & Kashmir': 'jk',
  Jharkhand: 'jh',
  Karnataka: 'ka',
  Kerala: 'kl',
  Ladakh: 'lh',
  'Madhya Pradesh': 'mp',
  Maharashtra: 'mh',
  Manipur: 'mn',
  Meghalaya: 'ml',
  Mizoram: 'mz',
  Nagaland: 'nl',
  Odisha: 'or',
  Punjab: 'pb',
  Puducherry: 'py',
  Rajasthan: 'rj',
  Sikkim: 'sk',
  'Tamil Nadu': 'tn',
  Telangana: 'tg',
  Tripura: 'tr',
  'Uttar Pradesh': 'up',
  Uttarakhand: 'ut',
  'West Bengal': 'wb',
};

const STATE_NAME_BY_ID = Object.fromEntries(
  Object.entries(STATE_ID_BY_NAME).map(([stateName, stateId]) => [stateId, stateName])
);

const OUTLINED_REGION_IDS = [
  'ap',
  'ar',
  'as',
  'br',
  'ct',
  'ga',
  'gj',
  'hr',
  'hp',
  'jh',
  'ka',
  'kl',
  'mp',
  'mh',
  'mn',
  'ml',
  'mz',
  'nl',
  'or',
  'pb',
  'rj',
  'sk',
  'tn',
  'tg',
  'tr',
  'up',
  'wb',
  'ch',
  'dn',
  'diu',
  'daman',
  'lh',
  'jk',
  'dl',
  'py',
  'ut',
];

const HIDDEN_IDS = [
  'pak-fill',
  'shaksgam-fill',
  'se-lh-foreign-claim-fill',
  'aksai-chin-fill',
  'pak-jk-lh-border',
  'water-body',
];

const MAP_VIEWBOX = '0 0 1594 1868';
const MAP_DOCUMENT_URL = `${process.env.PUBLIC_URL || ''}/india-states-unlabelled.svg`;

const ensureGradient = (svgElement) => {
  if (!svgElement || svgElement.querySelector('#zaykaaStateGradient')) {
    return;
  }

  const svgNamespace = 'http://www.w3.org/2000/svg';
  const defs = svgElement.querySelector('defs') || document.createElementNS(svgNamespace, 'defs');

  if (!defs.parentNode) {
    svgElement.insertBefore(defs, svgElement.firstChild);
  }

  const gradient = document.createElementNS(svgNamespace, 'linearGradient');
  gradient.setAttribute('id', 'zaykaaStateGradient');
  gradient.setAttribute('x1', '0%');
  gradient.setAttribute('y1', '0%');
  gradient.setAttribute('x2', '100%');
  gradient.setAttribute('y2', '100%');

  [
    { offset: '0%', color: '#fb923c' },
    { offset: '52%', color: '#f97316' },
    { offset: '100%', color: '#facc15' },
  ].forEach(({ offset, color }) => {
    const stop = document.createElementNS(svgNamespace, 'stop');
    stop.setAttribute('offset', offset);
    stop.setAttribute('stop-color', color);
    gradient.appendChild(stop);
  });

  defs.appendChild(gradient);
};

const IndiaFoodMap = ({ regionalStates, selectedState, onSelectState }) => {
  const objectRef = useRef(null);
  const [mapVersion, setMapVersion] = useState(0);

  const supportedStatesById = useMemo(
    () =>
      regionalStates.reduce((stateMap, region) => {
        const stateId = STATE_ID_BY_NAME[region.state];

        if (stateId) {
          stateMap.set(stateId, region.state);
        }

        return stateMap;
      }, new Map()),
    [regionalStates]
  );

  const selectedStateId = STATE_ID_BY_NAME[selectedState] || '';

  useEffect(() => {
    const svgElement = objectRef.current?.contentDocument?.querySelector('svg');

    if (!svgElement) {
      return undefined;
    }

    svgElement.setAttribute('viewBox', MAP_VIEWBOX);
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    ensureGradient(svgElement);

    const interactiveBindings = [];

    OUTLINED_REGION_IDS.forEach((regionId) => {
      const element = svgElement.querySelector(`#${regionId}`);
      if (!element) {
        return;
      }

      element.classList.remove('zaykaa-map-region', 'zaykaa-map-interactive', 'zaykaa-state-active');
      element.removeAttribute('data-state-name');
      element.removeAttribute('role');
      element.removeAttribute('tabindex');
      element.removeAttribute('aria-label');

      element.classList.add('zaykaa-map-region');

      const stateName = supportedStatesById.get(regionId) || STATE_NAME_BY_ID[regionId];

      if (stateName && supportedStatesById.has(regionId)) {
        const handleClick = () => {
          onSelectState(stateName);
        };

        const handleKeyDown = (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') {
            return;
          }

          event.preventDefault();
          onSelectState(stateName);
        };

        element.classList.add('zaykaa-map-interactive');
        element.setAttribute('data-state-name', stateName);
        element.setAttribute('role', 'button');
        element.setAttribute('tabindex', '0');
        element.setAttribute('aria-label', `Select ${stateName}`);
        element.addEventListener('click', handleClick);
        element.addEventListener('keydown', handleKeyDown);

        interactiveBindings.push({ element, handleClick, handleKeyDown });
      }

      if (regionId === selectedStateId) {
        element.classList.add('zaykaa-state-active');
      }
    });

    HIDDEN_IDS.forEach((hiddenId) => {
      const hiddenElement = svgElement.querySelector(`#${hiddenId}`);
      if (hiddenElement) {
        hiddenElement.classList.add('zaykaa-map-hidden');
      }
    });

    let styleElement = svgElement.querySelector('#zaykaa-map-styles');
    if (!styleElement) {
      styleElement = svgElement.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'style');
      styleElement.setAttribute('id', 'zaykaa-map-styles');
      svgElement.appendChild(styleElement);
    }

    styleElement.textContent = `
      .zaykaa-map-hidden {
        display: none !important;
      }

      .zaykaa-map-region,
      .zaykaa-map-region path,
      .zaykaa-map-region use {
        fill: transparent !important;
        stroke: rgba(100, 116, 139, 0.9) !important;
        stroke-width: 2.15 !important;
        stroke-linejoin: round !important;
        vector-effect: non-scaling-stroke;
        transition: fill 180ms ease, stroke 180ms ease, filter 180ms ease, opacity 180ms ease;
      }

      .zaykaa-map-interactive,
      .zaykaa-map-interactive path,
      .zaykaa-map-interactive use {
        cursor: pointer;
      }

      .zaykaa-map-interactive:hover,
      .zaykaa-map-interactive:hover path,
      .zaykaa-map-interactive:hover use {
        fill: rgba(249, 115, 22, 0.08) !important;
        stroke: rgba(234, 88, 12, 0.98) !important;
      }

      .zaykaa-map-interactive:focus,
      .zaykaa-map-interactive:focus path,
      .zaykaa-map-interactive:focus use {
        outline: none;
        filter: drop-shadow(0 0 14px rgba(249, 115, 22, 0.34));
      }

      .zaykaa-state-active,
      .zaykaa-state-active path,
      .zaykaa-state-active use {
        fill: url(#zaykaaStateGradient) !important;
        stroke: #f97316 !important;
        stroke-width: 2.8 !important;
        opacity: 1 !important;
        filter: drop-shadow(0 16px 26px rgba(249, 115, 22, 0.24));
      }
    `;

    return () => {
      interactiveBindings.forEach(({ element, handleClick, handleKeyDown }) => {
        element.removeEventListener('click', handleClick);
        element.removeEventListener('keydown', handleKeyDown);
      });
    };
  }, [mapVersion, onSelectState, selectedStateId, supportedStatesById]);

  return (
    <div className="india-map-shell w-full overflow-hidden rounded-[2rem] border border-white/60 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.97),_rgba(255,247,236,0.9)_46%,_rgba(255,236,214,0.8)_100%)] p-3 shadow-inner dark:border-white/10 dark:bg-[radial-gradient(circle_at_top,_rgba(39,29,20,0.98),_rgba(58,40,24,0.88)_52%,_rgba(34,24,18,0.94)_100%)] sm:p-4">
      <object
        ref={objectRef}
        data={MAP_DOCUMENT_URL}
        type="image/svg+xml"
        aria-label="India map for regional food selection"
        onLoad={() => setMapVersion((current) => current + 1)}
        className="mx-auto block w-full max-w-[680px]"
      />
    </div>
  );
};

export default IndiaFoodMap;
