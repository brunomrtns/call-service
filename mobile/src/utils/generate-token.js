const window = { TKK: "422854.923862967" };

let yr = null;

const encodeToken = (input, tokenArray) => {
  for (let c = 0; c < tokenArray.length - 2; c += 3) {
    let d = tokenArray.charAt(c + 2);
    d = d >= "a" ? d.charCodeAt(0) - 87 : Number(d);
    d = tokenArray.charAt(c + 1) === "+" ? input >>> d : input << d;
    input = tokenArray.charAt(c) === "+" ? (input + d) & 4294967295 : input ^ d;
  }
  return input;
};

const generateToken = (srt) => {
  let b;
  if (yr !== null) b = yr;
  else {
    b = () => String.fromCharCode(84);
    const c = () => String.fromCharCode(75);
    b = [b(), b()];
    b[1] = c();
    b = (yr = window[b.join(c())] || "") || "";
  }

  const d = () => String.fromCharCode(116);
  const tkParams = "&" + [d(), d()].join("") + "=";
  const splitB = b.split(".");
  let tokenValue = Number(splitB[0]) || 0;

  let e = [];
  let f = 0;
  for (let g = 0; g < srt.length; g++) {
    let l = srt.charCodeAt(g);
    if (l < 128) e[f++] = l;
    else {
      if (l < 2048) e[f++] = (l >> 6) | 192;
      else {
        if (
          (l & 64512) === 55296 &&
          g + 1 < srt.length &&
          (srt.charCodeAt(g + 1) & 64512) === 56320
        ) {
          l = 65536 + ((l & 1023) << 10) + (srt.charCodeAt(++g) & 1023);
          e[f++] = (l >> 18) | 240;
          e[f++] = ((l >> 12) & 63) | 128;
        } else e[f++] = (l >> 12) | 224;
        e[f++] = ((l >> 6) & 63) | 128;
      }
      e[f++] = (l & 63) | 128;
    }
  }
  for (f = 0; f < e.length; f++) {
    tokenValue += e[f];
    tokenValue = encodeToken(tokenValue, "+-a^+6");
  }
  tokenValue = encodeToken(tokenValue, "+-3^+b+-f");
  tokenValue ^= Number(splitB[1]) || 0;
  if (tokenValue < 0) tokenValue = (tokenValue & 2147483647) + 2147483648;
  tokenValue %= 1e6;

  return (
    tkParams + (tokenValue.toString() + "." + (tokenValue ^ Number(splitB[0])))
  );
};

export const fetchToken = (text) => generateToken(text);
