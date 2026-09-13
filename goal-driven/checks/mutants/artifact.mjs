// Artifact mutants are page injections applied after load and before measurement. They break the
// rendered result without touching the build's source.

export const ARTIFACT_MUTANTS = [
  {
    id: 'am-fetch',
    label: 'the page requests a remote font',
    expect: ['A8'],
    inject: async page => {
      await page.addInitScript(() => {
        window.addEventListener('DOMContentLoaded', () => {
          const l = document.createElement('link');
          l.rel = 'stylesheet';
          l.href = 'https://fonts.googleapis.com/css2?family=Inter';
          document.head.appendChild(l);
        });
      });
    }
  },
  {
    id: 'am-wide',
    label: 'an element overflows the 360px viewport',
    expect: ['A9'],
    inject: async page => {
      await page.addInitScript(() => {
        window.addEventListener('DOMContentLoaded', () => {
          const d = document.createElement('div');
          d.style.cssText = 'width:800px;height:4px;';
          document.body.appendChild(d);
        });
      });
    }
  },
  {
    id: 'am-tiny-targets',
    label: 'interactive targets are shrunk below 44px',
    expect: ['A10'],
    inject: async page => {
      await page.addInitScript(() => {
        window.addEventListener('DOMContentLoaded', () => {
          const s = document.createElement('style');
          s.textContent = 'button,[role="button"],a[href]{height:20px!important;min-height:20px!important;padding:0!important}';
          document.head.appendChild(s);
        });
      });
    }
  },
  {
    id: 'am-colour-only',
    label: 'two identical controls are distinguished only by saturation',
    expect: ['A7'],
    inject: async page => {
      await page.addInitScript(() => {
        window.addEventListener('DOMContentLoaded', () => {
          const s = document.createElement('style');
          // One background colour, two saturations. CSS saturate() interpolates toward the
          // luminance matrix, so in principle it preserves 0.2126R+0.7152G+0.0722B — but only
          // while every channel stays in gamut. A strong saturation clamps a channel and the
          // preservation is lost with it: #c04000 at saturate(3) renders a DIFFERENT grey from
          // the same colour at saturate(0.2), which would make this mutant catchable without
          // testing anything about colour.
          //
          // These values were measured in Chromium, not derived: #998877 at saturate(1.4) and
          // saturate(0.6) renders two distinct colours and a single identical grey, stably
          // across runs. Change them only against a fresh measurement.
          s.textContent = `
            button,[role="button"]{background:#998877!important;color:#000!important;font-size:0!important;width:100px!important;height:48px!important}
            button:nth-of-type(odd),[role="button"]:nth-of-type(odd){filter:saturate(1.4)!important}
            button:nth-of-type(even),[role="button"]:nth-of-type(even){filter:saturate(0.6)!important}`;
          document.head.appendChild(s);
        });
      });
    }
  }
];
