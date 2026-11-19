# Portfolio

Next.js 16 + Tailwind + MDX ile kişisel portfolio sitesi. GitHub Pages'a (`https://omertnk.github.io`) statik olarak deploy edilmek üzere hazırlanmıştır.

## Geliştirme

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (deploy öncesi kontrol)
```

## Yeni proje eklemek

1. `content/_TEMPLATE.mdx` dosyasını `content/projects/<slug>.mdx` olarak kopyala.
   `<slug>` URL'de görünür (`/projects/<slug>`): küçük harf, boşluk yerine tire.
2. Kapak görselini `public/projects/<slug>/cover.png` (veya `.jpg` / `.webp`) olarak koy (16:9, ~1600×900).
   Ek görseller de aynı klasöre.
3. Frontmatter'ı doldur, altına Markdown ile anlat. Bitti — sayfa otomatik oluşur.

Frontmatter alanları:

| Alan       | Zorunlu | Açıklama                                          |
| ---------- | ------- | ------------------------------------------------- |
| `title`    | ✓       | Proje adı                                         |
| `summary`  | ✓       | Tek cümle; kartlarda ve meta açıklamada kullanılır |
| `date`     | ✓       | `YYYY-MM-DD`; sıralama buna göre                  |
| `tags`     | ✓       | Teknoloji etiketleri                              |
| `role`     |         | Rolün                                             |
| `duration` |         | Süre                                              |
| `team`     |         | Ekip büyüklüğü                                    |
| `status`   |         | `released` / `active` / `shelved` / `prototype` → kartta rozet |
| `featured` |         | `true` → ana sayfada (ilk 3)                      |
| `draft`    |         | `true` → sadece dev'de görünür                    |
| `cover`    |         | Varsayılan: klasördeki `cover.png/jpg/jpeg/webp`  |
| `links`    |         | `github`, `demo`, `video`, `store` — boşlar gizli |

MDX içinde kullanılabilen bileşenler:

```mdx
<Video src="https://www.youtube.com/watch?v=XXXX" />   // YouTube
<Video src="/projects/slug/demo.mp4" />                 // yerel video
<Gallery images={["/projects/slug/1.jpg", "/projects/slug/2.jpg"]} />
<Gallery cols={3} images={[...]} />
```

`<Figure>` yerel `.mp4` / `.webm` dosyasını GIF gibi oynatır (sessiz, döngülü, otomatik; tıklayınca durur/devam eder); ses ve kontroller için `controls` ekle.

Klipler ekrana 400px yaklaştığında yüklenir, yalnızca ekranda ve sekme açıkken oynar. Kullanıcının durdurduğu klip kendiliğinden devam etmez. İsteğe bağlı `poster="/projects/slug/preview.jpg"` ile yükleme öncesi görsel eklenebilir. Yükleme hatasında klibe tıklamak yeniden dener.

Yeni MP4 dosyalarında oynatma bilgisini başa almak için `node scripts/faststart.mjs public/projects/<slug>` çalıştır. Bu işlem görüntü/ses kalitesini ve dosya boyutunu değiştirmez; sıkıştırma için `clip.mjs` kullanılır. Kısa, yaklaşık 960px genişlikte klipler tercih et; uzun 1080p kayıtlar yavaş bağlantılarda hâlâ bekletebilir.

Yardımcı scriptler:

- Geçici kapak: `node scripts/placeholder.mjs <slug> [hex-renk]`
- Videodan kısa klip (ffmpeg gerekir): `node scripts/clip.mjs <video> <slug>/<ad> <mm:ss> <saniye>`

## Kişisel bilgileri düzenlemek

- `src/config/site.ts` — isim, unvan, açıklama, e-posta, sosyal linkler, menü
- `src/app/about/page.tsx` — Hakkımda metni
- `src/app/globals.css` — renk paleti (`:root` değişkenleri)

## GitHub Pages'a deploy

1. GitHub'da repo adını `omertnk.github.io` yap ve **Public** olarak ayarla.
2. Repo **Settings → Pages → Source** ayarını **GitHub Actions** seç.
3. `main` dalına `git push` yaptığında `.github/workflows/deploy.yml` otomatik olarak `out/` çıktısını üretip `https://omertnk.github.io` adresinde yayınlar.

## Yapı

```
content/projects/*.mdx      proje içerikleri
public/projects/<slug>/     proje görselleri
src/config/site.ts          site ayarları
src/lib/projects.ts         MDX okuma / listeleme
src/components/             UI bileşenleri (mdx/ altında MDX bileşenleri)
src/app/                    sayfalar (App Router)
```
