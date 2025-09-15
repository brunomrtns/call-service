#!/usr/bin/env bash
set -e

# ------------------------------------------
# Script de instalação completa do Scrcpy
# Versão: 2.0
# Compatível com: Ubuntu 20.04/22.04/23.04/24.04, Debian 11/12
# ------------------------------------------

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
INSTALL_DIR="${SCRCPY_INSTALL_DIR:-$HOME/scrcpy}"
BUILD_TYPE="${SCRCPY_BUILD_TYPE:-release}"
BACKUP_OLD=true

# Função para log colorido
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Função para verificar se o comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para instalar dependências específicas da distribuição
install_dependencies() {
    log_info "Identificando distribuição..."
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        case $ID in
            ubuntu|debian)
                log_info "Distribuição detectada: $NAME $VERSION"
                log_info "Instalando dependências..."
                
                sudo apt update
                sudo apt install -y \
                    git wget adb gcc pkg-config meson ninja-build \
                    ffmpeg libsdl2-dev libavcodec-dev libavformat-dev \
                    libavutil-dev libavfilter-dev libswscale-dev \
                    libavdevice-dev libswresample-dev libusb-1.0-0-dev \
                    libusb-1.0-doc make build-essential
                ;;
            *)
                log_error "Distribuição não suportada: $ID"
                log_info "Por favor, instale manualmente as dependências:"
                log_info "- git, wget, adb, gcc, pkg-config, meson, ninja-build"
                log_info "- ffmpeg, libsdl2-dev, libavcodec-dev, libavutil-dev"
                log_info "- libavformat-dev, libavfilter-dev, libusb-1.0-0-dev"
                exit 1
                ;;
        esac
    else
        log_error "Não foi possível identificar a distribuição"
        exit 1
    fi
}

# Função para fazer backup da instalação anterior
backup_old_installation() {
    if command_exists scrcpy && [ "$BACKUP_OLD" = true ]; then
        log_info "Fazendo backup da instalação anterior..."
        OLD_VERSION=$(scrcpy --version 2>/dev/null || echo "unknown")
        BACKUP_DIR="$HOME/scrcpy_backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Encontrar e copiar arquivos do scrcpy
        find /usr -name "*scrcpy*" 2>/dev/null | while read -r file; do
            cp --parents "$file" "$BACKUP_DIR/" 2>/dev/null || true
        done
        
        log_info "Backup salvo em: $BACKUP_DIR"
    fi
}

# Função para remover instalações antigas
remove_old_versions() {
    log_info "Removendo versões antigas do Scrcpy..."
    
    # Remover via apt
    sudo apt remove -y scrcpy 2>/dev/null || true
    sudo apt purge -y scrcpy 2>/dev/null || true
    
    # Remover instalações manuais
    sudo rm -f /usr/local/bin/scrcpy
    sudo rm -f /usr/bin/scrcpy
    sudo rm -rf /usr/local/share/scrcpy
}

# Função para clonar/atualizar repositório
setup_repository() {
    if [ -d "$INSTALL_DIR" ]; then
        log_info "Atualizando repositório existente..."
        cd "$INSTALL_DIR"
        git pull
        git fetch --tags
    else
        log_info "Clonando repositório do Scrcpy..."
        git clone https://github.com/Genymobile/scrcpy.git "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi
}

# Função para compilar e instalar
compile_and_install() {
    log_info "Configurando build (tipo: $BUILD_TYPE)..."
    
    # Limpar builds anteriores
    rm -rf build
    
    # Configurar com Meson
    meson setup build --buildtype="$BUILD_TYPE" \
        --strip \
        --optimization=3
    
    log_info "Compilando com Ninja..."
    ninja -C build
    
    log_info "Instalando no sistema..."
    sudo ninja -C build install
    
    # Atualizar database de comandos
    sudo ldconfig 2>/dev/null || true
}

# Função para verificar instalação
verify_installation() {
    if command_exists scrcpy; then
        VERSION=$(scrcpy --version 2>/dev/null || echo "Desconhecida")
        log_success "Scrcpy instalado com sucesso! Versão: $VERSION"
        log_info "Execute: scrcpy --help para ver opções"
        log_info "Certifique-se de habilitar a depuração USB no seu dispositivo Android"
    else
        log_error "Falha na instalação. Verifique os logs acima."
        exit 1
    fi
}

# Função para instalar ADB se necessário
install_adb_if_needed() {
    if ! command_exists adb; then
        log_info "Instalando Android Debug Bridge (ADB)..."
        sudo apt install -y android-tools-adb
    fi
}

# Função para configurar udev rules (opcional)
setup_udev_rules() {
    read -p "Deseja configurar regras udev para dispositivos Android? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Configurando regras udev..."
        
        # Criar arquivo de regras
        UDEV_RULES_FILE="/etc/udev/rules.d/51-android.rules"
        echo '# Regras Udev para dispositivos Android
SUBSYSTEM=="usb", ATTR{idVendor}=="18d1", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="04e8", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="22b8", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="0bb4", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="12d1", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="0489", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="05c6", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="1004", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="1d4d", MODE="0666", GROUP="plugdev"' | sudo tee "$UDEV_RULES_FILE" > /dev/null
        
        sudo chmod 644 "$UDEV_RULES_FILE"
        sudo udevadm control --reload-rules
        sudo udevadm trigger
        
        log_success "Regras udev configuradas. Reinicie o sistema ou reconecte o dispositivo."
    fi
}

# Função de ajuda
show_help() {
    echo "Script de instalação do Scrcpy"
    echo "Uso: $0 [opções]"
    echo ""
    echo "Opções:"
    echo "  -d, --dir DIR      Diretório de instalação (padrão: \$HOME/scrcpy)"
    echo "  -t, --type TYPE    Tipo de build (release|debug|plain, padrão: release)"
    echo "  -n, --no-backup    Não fazer backup da instalação anterior"
    echo "  -h, --help         Mostrar esta ajuda"
    echo ""
    echo "Variáveis de ambiente:"
    echo "  SCRCPY_INSTALL_DIR  Diretório de instalação"
    echo "  SCRCPY_BUILD_TYPE   Tipo de build"
    echo ""
    echo "Exemplos:"
    echo "  $0                          # Instalação padrão"
    echo "  $0 -d /opt/scrcpy           # Instalar em diretório específico"
    echo "  SCRCPY_BUILD_TYPE=debug $0  # Build de debug"
}

# Processar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--dir)
            INSTALL_DIR="$2"
            shift 2
            ;;
        -t|--type)
            BUILD_TYPE="$2"
            shift 2
            ;;
        -n|--no-backup)
            BACKUP_OLD=false
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Opção desconhecida: $1"
            show_help
            exit 1
            ;;
    esac
done

# Verificar se é root
if [ "$EUID" -eq 0 ]; then
    log_error "Não execute este script como root!"
    log_info "Execute como usuário normal e use sudo quando necessário."
    exit 1
fi

# Main execution
log_info "=== Iniciando instalação do Scrcpy ==="
log_info "Diretório: $INSTALL_DIR"
log_info "Tipo de build: $BUILD_TYPE"

install_dependencies
install_adb_if_needed
backup_old_installation
remove_old_versions
setup_repository
compile_and_install
verify_installation
setup_udev_rules

log_success "=== Instalação concluída com sucesso! ==="
log_info "Execute 'scrcpy' para iniciar"
log_info "Configure a depuração USB no seu dispositivo Android:"
log_info "1. Vá em Configurações > Sobre o telefone"
log_info "2. Toque 7 vezes em 'Número da versão' para habilitar opções de desenvolvedor"
log_info "3. Volte e vá em Opções do desenvolvedor > Depuração USB"