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

# Download custom template fonts (Cardo and Bebas Neue) from Google Fonts
RUN mkdir -p /usr/share/fonts/truetype/custom && \
    curl -L -o /usr/share/fonts/truetype/custom/Cardo-Regular.ttf https://github.com/google/fonts/raw/main/ofl/cardo/Cardo-Regular.ttf && \
    curl -L -o /usr/share/fonts/truetype/custom/Cardo-Bold.ttf https://github.com/google/fonts/raw/main/ofl/cardo/Cardo-Bold.ttf && \
    curl -L -o /usr/share/fonts/truetype/custom/Cardo-Italic.ttf https://github.com/google/fonts/raw/main/ofl/cardo/Cardo-Italic.ttf && \
    curl -L -o /usr/share/fonts/truetype/custom/BebasNeue-Regular.ttf https://github.com/google/fonts/raw/main/ofl/bebasneue/BebasNeue-Regular.ttf && \
    cp /usr/share/fonts/truetype/custom/BebasNeue-Regular.ttf "/usr/share/fonts/truetype/custom/Bebas Neue Bold.ttf" && \
    fc-cache -fv

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
