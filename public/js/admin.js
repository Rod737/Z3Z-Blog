// JavaScript para o painel administrativo
document.addEventListener('DOMContentLoaded', function() {
    // Destacar menu ativo
    const currentPath = window.location.pathname;
    const menuLinks = document.querySelectorAll('.admin-menu-link');
    
    menuLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath || 
            currentPath.includes(link.getAttribute('href')) && 
            link.getAttribute('href') !== '/admin/dashboard') {
            link.classList.add('active');
        }
    });

    // Confirmação de exclusão
    const deleteButtons = document.querySelectorAll('[data-confirm]');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!confirm(this.dataset.confirm)) {
                e.preventDefault();
            }
        });
    });

    // Auto-hide alerts
    const alerts = document.querySelectorAll('.admin-alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                alert.remove();
            }, 300);
        }, 5000);
    });

    // Sidebar toggle para mobile
    const sidebarToggle = document.querySelector('.admin-sidebar-toggle');
    const sidebar = document.querySelector('.admin-sidebar');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // Auto-resize textarea
    const textareas = document.querySelectorAll('.admin-form-textarea');
    textareas.forEach(textarea => {
        const adjustHeight = () => {
            textarea.style.height = 'auto';
            textarea.style.height = Math.max(150, textarea.scrollHeight) + 'px';
        };
        
        textarea.addEventListener('input', adjustHeight);
        adjustHeight(); // Ajustar altura inicial
    });

    // Contador de caracteres para campos de texto
    const textInputs = document.querySelectorAll('.admin-form-input[type="text"], .admin-form-textarea');
    textInputs.forEach(input => {
        const maxLength = input.getAttribute('maxlength');
        if (maxLength) {
            const counter = document.createElement('small');
            counter.style.color = 'var(--medium-gray)';
            counter.style.display = 'block';
            counter.style.marginTop = '5px';
            counter.style.textAlign = 'right';
            
            const updateCounter = () => {
                const remaining = maxLength - input.value.length;
                counter.textContent = `${input.value.length}/${maxLength}`;
                counter.style.color = remaining < 20 ? '#dc3545' : 'var(--medium-gray)';
            };
            
            input.addEventListener('input', updateCounter);
            input.parentNode.appendChild(counter);
            updateCounter();
        }
    });

    // Preview de imagens (se houver upload)
    const imageInputs = document.querySelectorAll('input[type="file"][accept*="image"]');
    imageInputs.forEach(input => {
        input.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    let preview = document.querySelector('.image-preview');
                    if (!preview) {
                        preview = document.createElement('div');
                        preview.className = 'image-preview';
                        preview.style.marginTop = '10px';
                        input.parentNode.appendChild(preview);
                    }
                    preview.innerHTML = `<img src="${e.target.result}" style="max-width: 200px; max-height: 200px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">`;
                };
                reader.readAsDataURL(file);
            }
        });
    });

    // Salvamento automático (rascunho)
    const forms = document.querySelectorAll('.admin-form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        let saveTimeout;
        
        const saveData = () => {
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });
            
            // Salvar no localStorage como rascunho
            localStorage.setItem('admin-draft-' + window.location.pathname, JSON.stringify(data));
            
            // Mostrar indicador de salvamento
            showSaveIndicator();
        };
        
        const showSaveIndicator = () => {
            let indicator = document.querySelector('.save-indicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'save-indicator';
                indicator.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--primary-gold);
                    color: var(--navy-blue);
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    z-index: 9999;
                    transition: all 0.3s ease;
                `;
                document.body.appendChild(indicator);
            }
            
            indicator.textContent = '💾 Rascunho salvo';
            indicator.style.opacity = '1';
            indicator.style.transform = 'translateY(0)';
            
            setTimeout(() => {
                indicator.style.opacity = '0';
                indicator.style.transform = 'translateY(-20px)';
            }, 2000);
        };
        
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(saveData, 2000); // Salvar após 2 segundos de inatividade
            });
        });
        
        // Restaurar rascunho ao carregar a página
        const savedData = localStorage.getItem('admin-draft-' + window.location.pathname);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                Object.keys(data).forEach(key => {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input) {
                        if (input.type === 'checkbox') {
                            input.checked = data[key] === 'on';
                        } else {
                            input.value = data[key];
                        }
                    }
                });
            } catch (e) {
                console.log('Erro ao restaurar rascunho:', e);
            }
        }
        
        // Limpar rascunho ao submeter o formulário
        form.addEventListener('submit', () => {
            localStorage.removeItem('admin-draft-' + window.location.pathname);
        });
    });

    console.log('🔧 Painel administrativo Z3Z carregado!');
});