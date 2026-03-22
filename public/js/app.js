function appShell() {
    return {
      sidebarOpen: localStorage.getItem('sidebar') !== 'closed',
      init() {
        this.$watch('sidebarOpen', (val) => {
          localStorage.setItem('sidebar', val ? 'open' : 'closed')
        })
      },
    }
  }
  
  function alertasBadge() {
    return {
      alertas: [],
      aberto: false,
      get criticos() {
        return this.alertas.filter((a) => a.tipo === 'critico').length
      },
      async carregar() {
        try {
          const res = await fetch('/api/alertas')
          this.alertas = await res.json()
        } catch (_) {
          this.alertas = []
        }
      },
    }
  }
  
  function confirmDelete(url, mensagem) {
    if (confirm(mensagem || 'Confirmar exclusão?')) {
      fetch(url, { method: 'DELETE' })
        .then((res) => {
          if (res.redirected) window.location.href = res.url
          else window.location.reload()
        })
        .catch(() => alert('Erro ao excluir.'))
    }
  }
  
  function flashMessage() {
    return {
      visible: false,
      message: '',
      type: 'success',
      show(msg, type = 'success') {
        this.message = msg
        this.type = type
        this.visible = true
        setTimeout(() => { this.visible = false }, 3500)
      },
    }
  }