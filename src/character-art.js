// Visually checked against the local originals and character designs.
// Lossless WebP derivatives preserve every decoded pixel, including alpha.
// HE has an opaque white background: do not remove it with CSS blending.
// CA: author-confirmed from-PixAI-2076185062904780782.png; MG remains absent.
const standing = code => `${import.meta.env.BASE_URL}assets/characters/${code}.webp`;
export const CHARACTER_ART = {
  수소: { image: standing('H'), width: 1152, height: 1744 },
  헬륨: { image: standing('HE'), width: 1152, height: 1744 },
  탄소: { image: standing('C'), width: 1152, height: 1744 },
  나트륨: { image: standing('NA'), width: 1152, height: 1744 },
  염소: { image: standing('CL'), width: 1152, height: 1744 },
  칼슘: { image: standing('CA'), width: 1152, height: 1744 },
};
