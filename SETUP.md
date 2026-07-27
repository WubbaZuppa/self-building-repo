# 🚀 Setup Guide / Kurulum Rehberi

Welcome to the self-building repo! This guide will help you set up the project. (Kendi kendini inşa eden depoya hoş geldiniz! Bu rehber projeyi kurmanıza yardımcı olacak.)

## Prerequisites (Önkoşullar)
- A GitHub account (Bir GitHub hesabı)
- That's it! No coding knowledge needed. (Bu kadar! Kodlama bilgisine gerek yok.)

## Step 1: Get a Free Gemini API Key (Adım 1: Ücretsiz Gemini API Anahtarı Alın)
1. Go to https://aistudio.google.com/apikey (Şu adrese gidin: https://aistudio.google.com/apikey)
2. Sign in with your Google account (Google hesabınızla giriş yapın)
3. Click "Create API Key" ("Create API Key" butonuna tıklayın)
4. Copy the key (it looks like: AIzaSy...) (Anahtarı kopyalayın, AIzaSy... gibi görünür)
5. Keep this key safe - you'll need it in Step 3 (Bu anahtarı güvenli bir yerde saklayın - Adım 3'te ihtiyacınız olacak)

## Step 2: Create a GitHub Personal Access Token (Adım 2: GitHub Kişisel Erişim Jetonu Oluşturun)
1. Go to https://github.com/settings/tokens?type=beta (Fine-grained tokens) (Şu adrese gidin: https://github.com/settings/tokens?type=beta)
2. Click "Generate new token" ("Generate new token" butonuna tıklayın)
3. Name: "self-building-repo" (İsim olarak "self-building-repo" yazın)
4. Expiration: 90 days (or custom) (Bitiş süresi: 90 gün veya isteğe bağlı)
5. Repository access: Select "Only select repositories" → choose your repo (Depo erişimi: "Only select repositories" seçin ve deponuzu seçin)
6. Permissions (İzinler):
   - Contents: Read and write (İçerik: Okuma ve yazma)
   - Issues: Read and write (Sorunlar: Okuma ve yazma)
   - Pull requests: Read and write (Çekme istekleri: Okuma ve yazma)
   - Workflows: Read and write (İş akışları: Okuma ve yazma)
   - Metadata: Read (auto-selected) (Meta veri: Okuma - otomatik seçilir)
7. Click "Generate token" ("Generate token" butonuna tıklayın)
8. Copy the token (starts with github_pat_...) (Jetonu kopyalayın, github_pat_... ile başlar)

## Step 3: Add Secrets to Your Repository (Adım 3: Deponuza Gizli Anahtarları Ekleyin)
1. Go to your repo on GitHub (GitHub'daki deponuza gidin)
2. Click Settings → Secrets and variables → Actions (Ayarlar → Sırlar ve değişkenler → Actions yolunu izleyin)
3. Click "New repository secret" ("New repository secret" butonuna tıklayın)
4. Add these two secrets (Şu iki gizli anahtarı ekleyin):
   - Name: `GEMINI_API_KEY` → Value: (paste your Gemini key / Gemini anahtarınızı yapıştırın)
   - Name: `AGENT_TOKEN` → Value: (paste your GitHub PAT / GitHub PAT jetonunuzu yapıştırın)

## Step 4: Enable GitHub Actions (Adım 4: GitHub Actions'ı Etkinleştirin)
1. Go to your repo → Actions tab (Deponuza gidin → Actions sekmesine tıklayın)
2. If prompted, click "I understand my workflows, go ahead and enable them" (Eğer sorulursa, "I understand my workflows, go ahead and enable them" butonuna tıklayın)

## Step 5: Write Your Project Spec (Adım 5: Proje Özelliklerinizi Yazın)
1. Open `PROJECT_SPEC.md` in your repo (Deponuzdaki `PROJECT_SPEC.md` dosyasını açın)
2. Describe what you want to build (in plain language!) (Ne inşa etmek istediğinizi basit bir dille açıklayın!)
3. Commit and push (Değişiklikleri kaydedin ve gönderin)
4. Watch the magic happen! 🎉 (Sihrin gerçekleşmesini izleyin! 🎉)

## Step 6: Watch the Build (Adım 6: İnşayı İzleyin)
1. Go to Actions tab to see workflows running (İş akışlarının çalıştığını görmek için Actions sekmesine gidin)
2. Go to Issues to see the plan (Planı görmek için Issues sekmesine gidin)
3. Go to Pull Requests to see the code being written and reviewed (Yazılan ve incelenen kodu görmek için Pull Requests sekmesine gidin)
4. Watch the README update with progress! (README'nin ilerlemeyle güncellenmesini izleyin!)

## Troubleshooting (Sorun Giderme)
- If workflows don't trigger: Check that AGENT_TOKEN has correct permissions (İş akışları tetiklenmiyorsa: AGENT_TOKEN'ın doğru izinlere sahip olduğunu kontrol edin)
- If AI calls fail: Check that GEMINI_API_KEY is correct (Yapay zeka çağrıları başarısız olursa: GEMINI_API_KEY'in doğru olduğunu kontrol edin)
- If nothing happens after push: Make sure you edited PROJECT_SPEC.md (Gönderimden sonra hiçbir şey olmuyorsa: PROJECT_SPEC.md'yi düzenlediğinizden emin olun)
