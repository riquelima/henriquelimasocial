// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Portfólio Henrique Lima — Validações E2E', () => {

  test('1. Carregamento da página, título e recursos essenciais', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('ERR_CONNECTION_RESET')) {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.goto('/');

    // Título correto
    await expect(page).toHaveTitle(/Henrique Lima/);

    // Header e seções principais presentes
    await expect(page.locator('.marca')).toHaveText('HENRIQUE.LIMA');
    await expect(page.locator('#topo')).toBeVisible();
    await expect(page.locator('#perfil')).toBeAttached();
    await expect(page.locator('#experiencia')).toBeAttached();
    await expect(page.locator('#projetos')).toBeAttached();

    // Link do Currículo em PDF
    const cvLink = page.locator('a[href="curriculo.pdf"]');
    await expect(cvLink).toBeVisible();

    // Retrato do perfil carregado com sucesso
    const retrato = page.locator('.retrato img');
    await expect(retrato).toBeVisible();

    // Sem erros graves no console
    expect(consoleErrors).toEqual([]);
  });

  test('2. Navegação suave pelas seções do currículo', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Navegação de menu desktop');
    await page.goto('/');

    // Clicar em "Experiência"
    await page.click('nav.nav-links a[href="#experiencia"]');
    await page.waitForTimeout(600);

    const expTop = await page.locator('#experiencia').evaluate(el => el.getBoundingClientRect().top);
    expect(Math.abs(expTop)).toBeLessThan(250);

    // Clicar em "Projetos"
    await page.click('nav.nav-links a[href="#projetos"]');
    await page.waitForTimeout(600);

    const projetosTop = await page.locator('#projetos').evaluate(el => el.getBoundingClientRect().top);
    expect(Math.abs(projetosTop)).toBeLessThan(250);
  });

  test('3. Estrutura dos cartões em Escada na Experiência', async ({ page }) => {
    await page.goto('/');

    const escada = page.locator('ol.escada');
    await expect(escada).toBeAttached();

    const degraus = page.locator('ol.escada li.degrau');
    await expect(degraus).toHaveCount(6);

    // Checa se o primeiro degrau (cargo atual) tem destaque
    await expect(degraus.first()).toHaveClass(/atual/);
  });

  test('4. Seção Projetos Realizados com cards e tags técnicas', async ({ page }) => {
    await page.goto('/');

    const projetos = page.locator('#projetos .obra');
    await expect(projetos).toHaveCount(5);

    // Projeto 1: SMUG AI (com animação/simulador)
    await expect(projetos.nth(0).locator('h3')).toContainText('SMUG AI');
    await expect(projetos.nth(0).locator('iframe')).toBeAttached();

    // Projeto 2: Clínica Top Dent (com vídeo)
    await expect(projetos.nth(1).locator('h3')).toContainText('Top Dent');
    await expect(projetos.nth(1).locator('video')).toBeAttached();
    await expect(projetos.nth(1)).toHaveClass(/inversa/);

    // Projeto 3: OpenWorkout (com vídeo)
    await expect(projetos.nth(2).locator('h3')).toContainText('OpenWorkout');
    await expect(projetos.nth(2).locator('video')).toBeAttached();

    // Projeto 4: Sandy Pet Shop (com vídeo)
    await expect(projetos.nth(3).locator('h3')).toContainText('Sandy Pet Shop');
    await expect(projetos.nth(3).locator('video')).toBeAttached();

    // Projeto 5: Nucleus Cleaning (com vídeo)
    await expect(projetos.nth(4).locator('h3')).toContainText('Nucleus Cleaning');
    await expect(projetos.nth(4).locator('video')).toBeAttached();
  });

  test('5. Inicialização do modo jogo e ativação do personagem', async ({ page }) => {
    await page.goto('/');

    // Inicialmente fora do jogo
    await expect(page.locator('body')).not.toHaveClass(/modo-jogo/);

    // Clicar no botão Jogar
    await page.click('[data-acao="jogar"]');
    await page.waitForTimeout(500);

    // Body entra em modo-jogo
    await expect(page.locator('body')).toHaveClass(/modo-jogo/);

    // HUD de som e pausa visíveis
    await expect(page.locator('#hudBotoes')).toBeVisible();
    await expect(page.locator('#btnSom')).toBeVisible();
    await expect(page.locator('#btnPausa')).toBeVisible();

    // Canvas do jogo ativo
    const canvas = page.locator('#jogo');
    await expect(canvas).toBeVisible();
  });

  test('6. Física do personagem e controles (Mover e Pular)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Teste de teclado desktop');
    await page.goto('/');

    await page.click('[data-acao="jogar"]');
    await page.waitForTimeout(600);

    const posInicial = await page.evaluate(() => {
      const p = window.PV.jogo.jogador;
      return { x: p.x, y: p.y };
    });

    // Pressionar seta para direita
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(400);
    await page.keyboard.up('ArrowRight');

    const posAposAndar = await page.evaluate(() => {
      const p = window.PV.jogo.jogador;
      return { x: p.x, y: p.y };
    });

    // Personagem andou para a direita
    expect(posAposAndar.x).toBeGreaterThan(posInicial.x);

    // Pulo com espaço
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);

    const posPulo = await page.evaluate(() => {
      const p = window.PV.jogo.jogador;
      return { vy: p.vy };
    });

    // Velocidade vertical negativa indica salto para cima
    expect(posPulo.vy).toBeLessThan(0);
  });

  test('7. Controles de toque em dispositivos móveis', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Teste específico para mobile');
    await page.goto('/');

    await page.click('[data-acao="jogar"]');
    await page.waitForTimeout(500);

    // Controles de toque visíveis no mobile
    const toque = page.locator('#toque');
    await expect(toque).toBeVisible();
    await expect(page.locator('[data-tecla="esq"]')).toBeVisible();
    await expect(page.locator('[data-tecla="dir"]')).toBeVisible();
    await expect(page.locator('[data-tecla="pulo"]')).toBeVisible();
  });

});
