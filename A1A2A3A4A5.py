import os

def compilar_scripts_recursivamente():
    """
    Encontra todos os arquivos no diretório atual E EM TODAS AS SUBPASTAS
    (exceto ele mesmo), e junta seu conteúdo em um único arquivo de texto.
    
    ATUALIZAÇÃO: Agora ignora a biblioteca gigante do MiniAudio.
    """
    caminho_raiz = os.getcwd()
    nome_deste_script = os.path.basename(__file__)
    arquivo_de_saida = 'Hord-io.txt'
    extensoes_alvo = ('.html', '.js', '.css', '.md')
    
    # --- LISTA DE EXCLUSÃO ---
    # Arquivos exatos que não queremos no TXT final
    ignorar_arquivos = {
    }
    
    # Pastas inteiras para ignorar (opcional, mas bom para performance)
    ignorar_pastas = {
        '.git'
    } 

    separador = "\n" * 25
    
    print(f"Iniciando busca recursiva em: {caminho_raiz}")
    
    with open(arquivo_de_saida, 'w', encoding='utf-8') as f_saida:
        print(f"Gerando '{arquivo_de_saida}'...\n")

        for root, dirs, files in os.walk(caminho_raiz):
            # Modifica a lista 'dirs' in-place para impedir que o os.walk entre em pastas ignoradas
            dirs[:] = [d for d in dirs if d not in ignorar_pastas]

            for nome_arquivo in files:
                # Lógica de filtro principal
                eh_extensao_alvo = nome_arquivo.endswith(extensoes_alvo)
                nao_eh_script = (nome_arquivo != nome_deste_script)
                nao_eh_ignorado = (nome_arquivo not in ignorar_arquivos)

                if eh_extensao_alvo and nao_eh_script:
                    if nao_eh_ignorado:
                        caminho_completo = os.path.join(root, nome_arquivo)
                        caminho_relativo = os.path.relpath(caminho_completo, caminho_raiz)
                        
                        try:
                            f_saida.write(f"{caminho_relativo}:\n\n")

                            with open(caminho_completo, 'r', encoding='utf-8') as f_entrada:
                                conteudo = f_entrada.read()
                                f_saida.write(conteudo)

                            f_saida.write(f"\n{separador}\n")
                            print(f"- [ADICIONADO] {caminho_relativo}")
                        
                        except Exception as e:
                            print(f"- [ERRO LENDO] {caminho_relativo}: {e}")
                    else:
                        print(f"- [IGNORADO BIBLIOTECA] {nome_arquivo}")

    print(f"\nProcesso concluído! Verifique '{arquivo_de_saida}'.")

if __name__ == "__main__":
    compilar_scripts_recursivamente()
