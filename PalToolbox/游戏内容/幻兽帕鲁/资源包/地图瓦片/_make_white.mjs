import { execSync } from 'child_process';
execSync(
  'ffmpeg -i T_icon_enemy_strong.webp -pix_fmt rgba -vf "colorlevels=romin=1:gomin=1:bomin=1:romax=1:gomax=1:bomax=1" -c:v libwebp -lossless 1 T_icon_enemy_strong_white.webp -y',
  { stdio: 'inherit', shell: true }
);
