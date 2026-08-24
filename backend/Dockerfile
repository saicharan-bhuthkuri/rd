FROM node:20-bullseye-slim

# Install LibreOffice and basic fonts for PDF conversion support
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    libreoffice-impress \
    fonts-dejavu \
    fonts-liberation \
    fonts-crosextra-carlito \
    fonts-crosextra-caladea \
    fontconfig \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Download custom template fonts (Cardo and Bebas Neue) from Google Fonts & Dharma Type
RUN mkdir -p /usr/share/fonts/truetype/custom && \
    curl -L -o /usr/share/fonts/truetype/custom/Cardo-Regular.ttf https://github.com/google/fonts/raw/main/ofl/cardo/Cardo-Regular.ttf && \
    curl -L -o /usr/share/fonts/truetype/custom/Cardo-Bold.ttf https://github.com/google/fonts/raw/main/ofl/cardo/Cardo-Bold.ttf && \
    curl -L -o /usr/share/fonts/truetype/custom/Cardo-Italic.ttf https://github.com/google/fonts/raw/main/ofl/cardo/Cardo-Italic.ttf && \
    curl -L -o /usr/share/fonts/truetype/custom/BebasNeue-Regular.ttf https://github.com/google/fonts/raw/main/ofl/bebasneue/BebasNeue-Regular.ttf && \
    curl -L -o "/usr/share/fonts/truetype/custom/Bebas Neue Bold.ttf" "https://github.com/dharmatype/Bebas-Neue/raw/master/fonts/BebasNeue(2014)ByFontFabric/BebasNeue-Bold.ttf"

# Download standard Microsoft Core Fonts for exact metrics compatibility
RUN curl -L -o /usr/share/fonts/truetype/custom/Calibri.ttf https://github.com/pjobson/Microsoft-Fonts/raw/master/Calibri.ttf && \
    curl -L -o "/usr/share/fonts/truetype/custom/Calibri Bold.ttf" "https://github.com/pjobson/Microsoft-Fonts/raw/master/Calibri%20Bold.ttf" && \
    curl -L -o "/usr/share/fonts/truetype/custom/Calibri Italic.ttf" "https://github.com/pjobson/Microsoft-Fonts/raw/master/Calibri%20Italic.ttf" && \
    curl -L -o "/usr/share/fonts/truetype/custom/Calibri Bold Italic.ttf" "https://github.com/pjobson/Microsoft-Fonts/raw/master/Calibri%20Bold%20Italic.ttf" && \
    curl -L -o /usr/share/fonts/truetype/custom/Arial.ttf https://github.com/pjobson/Microsoft-Fonts/raw/master/Arial.ttf && \
    curl -L -o "/usr/share/fonts/truetype/custom/Arial Bold.ttf" "https://github.com/pjobson/Microsoft-Fonts/raw/master/Arial%20Bold.ttf" && \
    curl -L -o "/usr/share/fonts/truetype/custom/Arial Italic.ttf" "https://github.com/pjobson/Microsoft-Fonts/raw/master/Arial%20Italic.ttf" && \
    curl -L -o "/usr/share/fonts/truetype/custom/Arial Bold Italic.ttf" "https://github.com/pjobson/Microsoft-Fonts/raw/master/Arial%20Bold%20Italic.ttf" && \
    curl -L -o "/usr/share/fonts/truetype/custom/Times New Roman.ttf" "https://github.com/pjobson/Microsoft-Fonts/raw/master/Times%20New%20Roman.ttf" && \
    curl -L -o "/usr/share/fonts/truetype/custom/Times New Roman Bold.ttf" "https://github.com/pjobson/Microsoft-Fonts/raw/master/Times%20New%20Roman%20Bold.ttf" && \
    curl -L -o "/usr/share/fonts/truetype/custom/Times New Roman Italic.ttf" "https://github.com/pjobson/Microsoft-Fonts/raw/master/Times%20New%20Roman%20Italic.ttf" && \
    curl -L -o "/usr/share/fonts/truetype/custom/Times New Roman Bold Italic.ttf" "https://github.com/pjobson/Microsoft-Fonts/raw/master/Times%20New%20Roman%20Bold%20Italic.ttf" && \
    fc-cache -fv

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN cp fonts/*.ttf /usr/share/fonts/truetype/custom/ && fc-cache -fv
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
