-- Biblioteca inicial de exercicios (gerado por tools/generate_seed.py)

INSERT INTO muscle_groups (slug, name, region, position) VALUES
    ('chest', 'Peito', 'FRONT', 0),
    ('back', 'Costas', 'BACK', 1),
    ('shoulders', 'Ombros', 'FRONT', 2),
    ('biceps', 'Bíceps', 'FRONT', 3),
    ('triceps', 'Tríceps', 'BACK', 4),
    ('forearms', 'Antebraço', 'FRONT', 5),
    ('abs', 'Abdômen', 'FRONT', 6),
    ('quads', 'Quadríceps', 'FRONT', 7),
    ('hamstrings', 'Posterior de coxa', 'BACK', 8),
    ('glutes', 'Glúteos', 'BACK', 9),
    ('calves', 'Panturrilhas', 'BACK', 10);

INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('supino-reto-barra', 'Supino reto com barra', (SELECT id FROM muscle_groups WHERE slug = 'chest'), 'BARBELL', 'INTERMEDIATE', 'PRESS_FLAT', 'Exercício base para força e massa do peitoral, com grande capacidade de carga.', 'Deite no banco com os olhos alinhados à barra e os pés firmes no chão.
Segure a barra um pouco além da largura dos ombros e retraia as escápulas.
Desça a barra controlando até tocar levemente a linha do mamilo.
Empurre a barra para cima até estender os cotovelos, sem tirar o quadril do banco.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'supino-reto-barra'), (SELECT id FROM muscle_groups WHERE slug = 'triceps'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'supino-reto-barra'), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('supino-reto-halteres', 'Supino reto com halteres', (SELECT id FROM muscle_groups WHERE slug = 'chest'), 'DUMBBELL', 'BEGINNER', 'PRESS_FLAT', 'Variação com halteres que permite maior amplitude e trabalha cada lado de forma independente.', 'Deite no banco com um halter em cada mão, na altura do peito.
Mantenha as escápulas retraídas e os punhos alinhados aos cotovelos.
Empurre os halteres para cima, aproximando-os no topo.
Desça devagar até sentir o alongamento do peitoral.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'supino-reto-halteres'), (SELECT id FROM muscle_groups WHERE slug = 'triceps'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'supino-reto-halteres'), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('supino-inclinado-halteres', 'Supino inclinado com halteres', (SELECT id FROM muscle_groups WHERE slug = 'chest'), 'DUMBBELL', 'BEGINNER', 'PRESS_INCLINE', 'Enfatiza a porção superior (clavicular) do peitoral.', 'Ajuste o banco entre 30° e 45° de inclinação.
Posicione os halteres ao lado do peito com os cotovelos a cerca de 45° do tronco.
Empurre para cima e levemente para dentro.
Retorne controlando até a altura do peito.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'supino-inclinado-halteres'), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'supino-inclinado-halteres'), (SELECT id FROM muscle_groups WHERE slug = 'triceps'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('supino-inclinado-barra', 'Supino inclinado com barra', (SELECT id FROM muscle_groups WHERE slug = 'chest'), 'BARBELL', 'INTERMEDIATE', 'PRESS_INCLINE', 'Versão com barra do supino inclinado, ideal para progressão de carga na parte superior do peito.', 'Deite no banco inclinado com a barra alinhada aos olhos.
Desça a barra até a parte alta do peito.
Empurre a barra para cima mantendo os cotovelos levemente fechados.
Não arqueie excessivamente a lombar.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'supino-inclinado-barra'), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'supino-inclinado-barra'), (SELECT id FROM muscle_groups WHERE slug = 'triceps'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('supino-declinado', 'Supino declinado', (SELECT id FROM muscle_groups WHERE slug = 'chest'), 'BARBELL', 'INTERMEDIATE', 'PRESS_DECLINE', 'Prioriza a porção inferior do peitoral com menor estresse nos ombros.', 'Prenda as pernas no apoio do banco declinado.
Retire a barra com os braços estendidos sobre o peito.
Desça até a parte baixa do peitoral.
Empurre de volta à posição inicial com controle.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'supino-declinado'), (SELECT id FROM muscle_groups WHERE slug = 'triceps'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('crucifixo-halteres', 'Crucifixo com halteres', (SELECT id FROM muscle_groups WHERE slug = 'chest'), 'DUMBBELL', 'BEGINNER', 'FLY', 'Isolador de peito que trabalha a adução horizontal com grande alongamento.', 'Deite no banco com os halteres acima do peito e as palmas viradas uma para a outra.
Mantenha uma leve flexão fixa nos cotovelos.
Abra os braços em arco até sentir o alongamento.
Feche os braços contraindo o peitoral, como se abraçasse uma árvore.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'crucifixo-halteres'), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('crossover', 'Crossover', (SELECT id FROM muscle_groups WHERE slug = 'chest'), 'CABLE', 'INTERMEDIATE', 'CABLE_FLY', 'Exercício no cabo que mantém tensão constante no peitoral durante todo o movimento.', 'Posicione as polias na altura dos ombros ou acima e segure as alças.
Dê um passo à frente e incline levemente o tronco.
Leve as mãos à frente e para baixo, cruzando-as levemente.
Retorne devagar até sentir o alongamento.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'crossover'), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('peck-deck', 'Peck deck', (SELECT id FROM muscle_groups WHERE slug = 'chest'), 'MACHINE', 'BEGINNER', 'CABLE_FLY', 'Máquina de voador que isola o peitoral com trajetória guiada e segura.', 'Ajuste o banco para que as alças fiquem na altura do peito.
Apoie as costas e segure as alças com os cotovelos levemente flexionados.
Feche os braços à frente contraindo o peito por um segundo.
Volte devagar até a posição inicial.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'peck-deck'), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('flexao-de-braco', 'Flexão de braço', (SELECT id FROM muscle_groups WHERE slug = 'chest'), 'BODYWEIGHT', 'BEGINNER', 'PUSHUP', 'Clássico com peso corporal que trabalha peito, tríceps e estabilidade do core.', 'Apoie as mãos no chão um pouco além da largura dos ombros.
Mantenha o corpo reto da cabeça aos calcanhares.
Desça até o peito quase tocar o chão.
Empurre o chão e volte à posição inicial.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'flexao-de-braco'), (SELECT id FROM muscle_groups WHERE slug = 'triceps'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'flexao-de-braco'), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'flexao-de-braco'), (SELECT id FROM muscle_groups WHERE slug = 'abs'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('chest-press', 'Chest press', (SELECT id FROM muscle_groups WHERE slug = 'chest'), 'MACHINE', 'BEGINNER', 'PRESS_FLAT', 'Supino na máquina, ótimo para iniciantes e para levar a série à falha com segurança.', 'Ajuste o assento para que as alças fiquem na linha do peito.
Mantenha as costas apoiadas e as escápulas retraídas.
Empurre as alças até quase estender os cotovelos.
Retorne controlando o peso.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'chest-press'), (SELECT id FROM muscle_groups WHERE slug = 'triceps'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'chest-press'), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('paralelas-peito', 'Mergulho nas paralelas', (SELECT id FROM muscle_groups WHERE slug = 'chest'), 'BODYWEIGHT', 'ADVANCED', 'DIP', 'Mergulho com tronco inclinado à frente para enfatizar a parte inferior do peito.', 'Apoie-se nas barras paralelas com os braços estendidos.
Incline o tronco levemente à frente.
Desça flexionando os cotovelos até os ombros ficarem abaixo dos cotovelos.
Empurre de volta até estender os braços.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'paralelas-peito'), (SELECT id FROM muscle_groups WHERE slug = 'triceps'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'paralelas-peito'), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('crucifixo-inclinado', 'Crucifixo inclinado', (SELECT id FROM muscle_groups WHERE slug = 'chest'), 'DUMBBELL', 'INTERMEDIATE', 'FLY', 'Crucifixo no banco inclinado, focado na porção superior do peitoral.', 'Ajuste o banco a 30°.
Comece com os halteres acima do peito e cotovelos levemente flexionados.
Abra os braços em arco controlado.
Retorne contraindo a parte alta do peito.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'crucifixo-inclinado'), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('puxada-frontal', 'Puxada frontal', (SELECT id FROM muscle_groups WHERE slug = 'back'), 'CABLE', 'BEGINNER', 'PULLDOWN', 'Principal exercício para largura das costas, trabalhando o latíssimo do dorso.', 'Sente-se e prenda as coxas sob o apoio.
Segure a barra com pegada pronada mais aberta que os ombros.
Puxe a barra até a parte alta do peito, levando os cotovelos para baixo.
Retorne estendendo os braços com controle.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'puxada-frontal'), (SELECT id FROM muscle_groups WHERE slug = 'biceps'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'puxada-frontal'), (SELECT id FROM muscle_groups WHERE slug = 'forearms'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('barra-fixa', 'Barra fixa', (SELECT id FROM muscle_groups WHERE slug = 'back'), 'BODYWEIGHT', 'ADVANCED', 'PULLUP', 'Exercício de peso corporal completo para as costas e bíceps.', 'Segure a barra com pegada pronada e mãos além da largura dos ombros.
Comece pendurado com os braços estendidos.
Puxe o corpo até o queixo passar a barra.
Desça devagar até estender os braços.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'barra-fixa'), (SELECT id FROM muscle_groups WHERE slug = 'biceps'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'barra-fixa'), (SELECT id FROM muscle_groups WHERE slug = 'forearms'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'barra-fixa'), (SELECT id FROM muscle_groups WHERE slug = 'abs'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('remada-curvada-barra', 'Remada curvada com barra', (SELECT id FROM muscle_groups WHERE slug = 'back'), 'BARBELL', 'INTERMEDIATE', 'ROW_BENT', 'Construtor de espessura das costas com grande recrutamento de dorsais e romboides.', 'Segure a barra e incline o tronco à frente mantendo a coluna neutra.
Flexione levemente os joelhos.
Puxe a barra em direção ao umbigo aproximando as escápulas.
Desça a barra até estender os braços.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'remada-curvada-barra'), (SELECT id FROM muscle_groups WHERE slug = 'biceps'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'remada-curvada-barra'), (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'remada-curvada-barra'), (SELECT id FROM muscle_groups WHERE slug = 'forearms'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('remada-unilateral', 'Remada unilateral com halter', (SELECT id FROM muscle_groups WHERE slug = 'back'), 'DUMBBELL', 'BEGINNER', 'ROW_BENT', 'Remada com apoio no banco que permite foco em cada lado das costas.', 'Apoie um joelho e uma mão no banco.
Segure o halter com o braço estendido.
Puxe o halter em direção ao quadril.
Desça controlando até alongar a dorsal.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'remada-unilateral'), (SELECT id FROM muscle_groups WHERE slug = 'biceps'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'remada-unilateral'), (SELECT id FROM muscle_groups WHERE slug = 'forearms'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('remada-baixa', 'Remada baixa no cabo', (SELECT id FROM muscle_groups WHERE slug = 'back'), 'CABLE', 'BEGINNER', 'ROW_SEATED', 'Remada sentada que trabalha a parte média das costas com tensão constante.', 'Sente-se com os pés apoiados e joelhos levemente flexionados.
Segure o triângulo com os braços estendidos e o tronco ereto.
Puxe até o abdômen aproximando as escápulas.
Retorne estendendo os braços sem curvar a coluna.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'remada-baixa'), (SELECT id FROM muscle_groups WHERE slug = 'biceps'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'remada-baixa'), (SELECT id FROM muscle_groups WHERE slug = 'forearms'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('remada-maquina', 'Remada na máquina', (SELECT id FROM muscle_groups WHERE slug = 'back'), 'MACHINE', 'BEGINNER', 'ROW_SEATED', 'Remada guiada com apoio no peito, isolando as costas sem sobrecarregar a lombar.', 'Ajuste o assento para que as alças fiquem na linha do peito.
Apoie o peito no encosto.
Puxe as alças levando os cotovelos para trás.
Retorne controlando.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'remada-maquina'), (SELECT id FROM muscle_groups WHERE slug = 'biceps'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('levantamento-terra', 'Levantamento terra', (SELECT id FROM muscle_groups WHERE slug = 'back'), 'BARBELL', 'ADVANCED', 'DEADLIFT', 'Exercício composto de força total que trabalha toda a cadeia posterior.', 'Posicione os pés na largura do quadril com a barra sobre o meio do pé.
Segure a barra, abaixe o quadril e mantenha a coluna neutra.
Empurre o chão e estenda quadril e joelhos ao mesmo tempo.
Desça a barra pelo mesmo trajeto, rente às pernas.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'levantamento-terra'), (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'levantamento-terra'), (SELECT id FROM muscle_groups WHERE slug = 'glutes'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'levantamento-terra'), (SELECT id FROM muscle_groups WHERE slug = 'forearms'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'levantamento-terra'), (SELECT id FROM muscle_groups WHERE slug = 'quads'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('pulldown-braco-estendido', 'Pulldown com braços estendidos', (SELECT id FROM muscle_groups WHERE slug = 'back'), 'CABLE', 'INTERMEDIATE', 'PULLDOWN', 'Isolador do latíssimo que mantém os cotovelos praticamente estendidos.', 'Fique de frente para a polia alta segurando a barra.
Incline levemente o tronco à frente.
Leve a barra até as coxas com os braços quase estendidos.
Retorne devagar até a altura dos olhos.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'pulldown-braco-estendido'), (SELECT id FROM muscle_groups WHERE slug = 'triceps'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('puxada-supinada', 'Puxada supinada', (SELECT id FROM muscle_groups WHERE slug = 'back'), 'CABLE', 'BEGINNER', 'PULLDOWN', 'Puxada com pegada fechada e supinada que aumenta a participação dos bíceps.', 'Segure a barra com as palmas viradas para você, na largura dos ombros.
Puxe a barra até o peito mantendo o tronco estável.
Contraia as costas no ponto final.
Retorne estendendo os braços.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'puxada-supinada'), (SELECT id FROM muscle_groups WHERE slug = 'biceps'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('remada-cavalinho', 'Remada cavalinho', (SELECT id FROM muscle_groups WHERE slug = 'back'), 'BARBELL', 'INTERMEDIATE', 'ROW_BENT', 'Remada com barra T que permite cargas altas e foco na espessura das costas.', 'Posicione-se sobre a barra com o tronco inclinado.
Segure o pegador com as duas mãos.
Puxe em direção ao peito mantendo a coluna neutra.
Desça controlando.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'remada-cavalinho'), (SELECT id FROM muscle_groups WHERE slug = 'biceps'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'remada-cavalinho'), (SELECT id FROM muscle_groups WHERE slug = 'forearms'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('desenvolvimento-halteres', 'Desenvolvimento com halteres', (SELECT id FROM muscle_groups WHERE slug = 'shoulders'), 'DUMBBELL', 'BEGINNER', 'OVERHEAD_PRESS', 'Exercício principal para o deltoide anterior e lateral.', 'Sente-se com o encosto ereto e os halteres na altura das orelhas.
Empurre os halteres para cima até quase estender os braços.
Não deixe a lombar sair do encosto.
Desça controlando até a altura inicial.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'desenvolvimento-halteres'), (SELECT id FROM muscle_groups WHERE slug = 'triceps'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('desenvolvimento-militar', 'Desenvolvimento militar com barra', (SELECT id FROM muscle_groups WHERE slug = 'shoulders'), 'BARBELL', 'INTERMEDIATE', 'OVERHEAD_PRESS', 'Desenvolvimento em pé com barra para força total dos ombros.', 'Segure a barra na altura das clavículas com pegada na largura dos ombros.
Contraia glúteos e abdômen.
Empurre a barra acima da cabeça, passando o rosto.
Desça a barra até as clavículas.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'desenvolvimento-militar'), (SELECT id FROM muscle_groups WHERE slug = 'triceps'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'desenvolvimento-militar'), (SELECT id FROM muscle_groups WHERE slug = 'abs'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('elevacao-lateral', 'Elevação lateral', (SELECT id FROM muscle_groups WHERE slug = 'shoulders'), 'DUMBBELL', 'BEGINNER', 'LATERAL_RAISE', 'Isolador do deltoide lateral, responsável pela largura dos ombros.', 'Fique em pé com um halter em cada mão ao lado do corpo.
Mantenha os cotovelos levemente flexionados.
Eleve os braços lateralmente até a altura dos ombros.
Desça devagar sem balançar o corpo.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('elevacao-frontal', 'Elevação frontal', (SELECT id FROM muscle_groups WHERE slug = 'shoulders'), 'DUMBBELL', 'BEGINNER', 'FRONT_RAISE', 'Isolador da porção anterior do deltoide.', 'Segure os halteres à frente das coxas.
Eleve os braços à frente até a altura dos ombros.
Mantenha o tronco imóvel.
Desça controlando.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'elevacao-frontal'), (SELECT id FROM muscle_groups WHERE slug = 'chest'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('crucifixo-invertido', 'Crucifixo invertido', (SELECT id FROM muscle_groups WHERE slug = 'shoulders'), 'DUMBBELL', 'INTERMEDIATE', 'REAR_DELT', 'Trabalha o deltoide posterior e a parte alta das costas.', 'Incline o tronco à frente com os halteres pendurados.
Mantenha os cotovelos levemente flexionados.
Abra os braços lateralmente aproximando as escápulas.
Retorne devagar.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'crucifixo-invertido'), (SELECT id FROM muscle_groups WHERE slug = 'back'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('face-pull', 'Face pull', (SELECT id FROM muscle_groups WHERE slug = 'shoulders'), 'CABLE', 'INTERMEDIATE', 'REAR_DELT', 'Exercício no cabo para deltoide posterior e saúde dos ombros.', 'Ajuste a polia na altura do rosto com a corda.
Puxe a corda em direção ao rosto abrindo as mãos.
Leve os cotovelos para trás e para cima.
Retorne controlando.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'face-pull'), (SELECT id FROM muscle_groups WHERE slug = 'back'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('elevacao-lateral-cabo', 'Elevação lateral no cabo', (SELECT id FROM muscle_groups WHERE slug = 'shoulders'), 'CABLE', 'INTERMEDIATE', 'LATERAL_RAISE', 'Elevação lateral com tensão constante desde o início do movimento.', 'Fique de lado para a polia baixa segurando a alça com a mão oposta.
Eleve o braço lateralmente até a altura do ombro.
Pause por um instante no topo.
Desça devagar.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('desenvolvimento-maquina', 'Desenvolvimento na máquina', (SELECT id FROM muscle_groups WHERE slug = 'shoulders'), 'MACHINE', 'BEGINNER', 'OVERHEAD_PRESS', 'Desenvolvimento guiado, seguro para progressão de carga.', 'Ajuste o assento para que as alças fiquem na altura dos ombros.
Empurre as alças para cima.
Não trave totalmente os cotovelos.
Retorne controlando.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'desenvolvimento-maquina'), (SELECT id FROM muscle_groups WHERE slug = 'triceps'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('encolhimento', 'Encolhimento com halteres', (SELECT id FROM muscle_groups WHERE slug = 'shoulders'), 'DUMBBELL', 'BEGINNER', 'SHRUG', 'Trabalha o trapézio superior.', 'Fique em pé com os halteres ao lado do corpo.
Eleve os ombros em direção às orelhas.
Segure a contração por um segundo.
Desça devagar.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'encolhimento'), (SELECT id FROM muscle_groups WHERE slug = 'back'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'encolhimento'), (SELECT id FROM muscle_groups WHERE slug = 'forearms'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('rosca-direta-barra', 'Rosca direta com barra', (SELECT id FROM muscle_groups WHERE slug = 'biceps'), 'BARBELL', 'BEGINNER', 'CURL', 'Exercício clássico para massa dos bíceps.', 'Fique em pé segurando a barra com pegada supinada.
Mantenha os cotovelos junto ao corpo.
Flexione os cotovelos levando a barra até os ombros.
Desça controlando sem balançar o tronco.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'rosca-direta-barra'), (SELECT id FROM muscle_groups WHERE slug = 'forearms'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('rosca-alternada', 'Rosca alternada com halteres', (SELECT id FROM muscle_groups WHERE slug = 'biceps'), 'DUMBBELL', 'BEGINNER', 'CURL', 'Rosca com supinação do punho, alternando os braços.', 'Segure os halteres ao lado do corpo com as palmas voltadas para dentro.
Flexione um cotovelo girando a palma para cima.
Desça devagar e repita com o outro braço.
Mantenha os cotovelos fixos.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'rosca-alternada'), (SELECT id FROM muscle_groups WHERE slug = 'forearms'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('rosca-martelo', 'Rosca martelo', (SELECT id FROM muscle_groups WHERE slug = 'biceps'), 'DUMBBELL', 'BEGINNER', 'CURL', 'Pegada neutra que trabalha bíceps, braquial e braquiorradial.', 'Segure os halteres com as palmas voltadas para o corpo.
Flexione os cotovelos mantendo a pegada neutra.
Suba até a altura dos ombros.
Desça controlando.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'rosca-martelo'), (SELECT id FROM muscle_groups WHERE slug = 'forearms'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('rosca-scott', 'Rosca Scott', (SELECT id FROM muscle_groups WHERE slug = 'biceps'), 'BARBELL', 'INTERMEDIATE', 'PREACHER_CURL', 'Rosca no banco Scott que elimina o balanço e isola os bíceps.', 'Apoie a parte de trás dos braços no banco Scott.
Segure a barra W com pegada supinada.
Flexione os cotovelos até a contração máxima.
Desça até quase estender os braços.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'rosca-scott'), (SELECT id FROM muscle_groups WHERE slug = 'forearms'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('rosca-concentrada', 'Rosca concentrada', (SELECT id FROM muscle_groups WHERE slug = 'biceps'), 'DUMBBELL', 'BEGINNER', 'PREACHER_CURL', 'Isolamento máximo do bíceps com o cotovelo apoiado na coxa.', 'Sente-se e apoie o cotovelo na parte interna da coxa.
Segure o halter com o braço estendido.
Flexione o cotovelo até o ombro.
Desça lentamente.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('rosca-cabo', 'Rosca no cabo', (SELECT id FROM muscle_groups WHERE slug = 'biceps'), 'CABLE', 'BEGINNER', 'CURL', 'Rosca com tensão constante na polia baixa.', 'Segure a barra da polia baixa com pegada supinada.
Mantenha os cotovelos junto ao corpo.
Flexione até a barra chegar aos ombros.
Retorne controlando.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'rosca-cabo'), (SELECT id FROM muscle_groups WHERE slug = 'forearms'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('rosca-inclinada', 'Rosca inclinada com halteres', (SELECT id FROM muscle_groups WHERE slug = 'biceps'), 'DUMBBELL', 'INTERMEDIATE', 'CURL', 'Rosca no banco inclinado que alonga a cabeça longa do bíceps.', 'Sente-se em um banco a 45° com os braços pendurados.
Flexione os cotovelos sem mover os ombros.
Contraia no topo.
Desça até alongar totalmente.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('triceps-corda', 'Tríceps corda', (SELECT id FROM muscle_groups WHERE slug = 'triceps'), 'CABLE', 'BEGINNER', 'PUSHDOWN', 'Extensão de cotovelo na polia alta com corda.', 'Segure a corda na polia alta com os cotovelos junto ao corpo.
Estenda os cotovelos abrindo a corda no final.
Contraia o tríceps por um segundo.
Retorne até 90° de flexão.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('triceps-pulley', 'Tríceps pulley com barra', (SELECT id FROM muscle_groups WHERE slug = 'triceps'), 'CABLE', 'BEGINNER', 'PUSHDOWN', 'Extensão de cotovelo na polia alta com barra reta ou V.', 'Segure a barra com pegada pronada.
Mantenha os cotovelos fixos ao lado do tronco.
Empurre a barra para baixo até estender os braços.
Suba controlando.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('triceps-testa', 'Tríceps testa', (SELECT id FROM muscle_groups WHERE slug = 'triceps'), 'BARBELL', 'INTERMEDIATE', 'SKULL_CRUSHER', 'Extensão deitado que trabalha todas as cabeças do tríceps.', 'Deite no banco segurando a barra W acima do peito.
Flexione apenas os cotovelos levando a barra até a testa.
Mantenha os cotovelos apontados para o teto.
Estenda os braços de volta.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('triceps-frances', 'Tríceps francês', (SELECT id FROM muscle_groups WHERE slug = 'triceps'), 'DUMBBELL', 'INTERMEDIATE', 'OVERHEAD_EXTENSION', 'Extensão acima da cabeça que enfatiza a cabeça longa do tríceps.', 'Segure um halter com as duas mãos acima da cabeça.
Desça o halter atrás da cabeça flexionando os cotovelos.
Mantenha os cotovelos apontados para cima.
Estenda os braços de volta.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('mergulho-banco', 'Mergulho no banco', (SELECT id FROM muscle_groups WHERE slug = 'triceps'), 'BODYWEIGHT', 'BEGINNER', 'DIP', 'Mergulho com as mãos apoiadas no banco atrás do corpo.', 'Apoie as mãos na borda do banco atrás de você.
Estenda as pernas à frente.
Desça o corpo flexionando os cotovelos até 90°.
Empurre de volta para cima.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'mergulho-banco'), (SELECT id FROM muscle_groups WHERE slug = 'chest'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'mergulho-banco'), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('supino-fechado', 'Supino fechado', (SELECT id FROM muscle_groups WHERE slug = 'triceps'), 'BARBELL', 'INTERMEDIATE', 'PRESS_FLAT', 'Supino com pegada fechada que transfere a ênfase para o tríceps.', 'Deite no banco e segure a barra na largura dos ombros.
Desça a barra até a parte baixa do peito com os cotovelos junto ao corpo.
Empurre a barra para cima.
Mantenha os punhos firmes.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'supino-fechado'), (SELECT id FROM muscle_groups WHERE slug = 'chest'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'supino-fechado'), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('triceps-coice', 'Tríceps coice', (SELECT id FROM muscle_groups WHERE slug = 'triceps'), 'DUMBBELL', 'BEGINNER', 'KICKBACK_ARM', 'Extensão de cotovelo com o tronco inclinado, isolando o tríceps.', 'Incline o tronco com o braço junto ao corpo e cotovelo a 90°.
Estenda o cotovelo levando o halter para trás.
Contraia o tríceps no final.
Retorne devagar.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('rosca-punho', 'Rosca de punho', (SELECT id FROM muscle_groups WHERE slug = 'forearms'), 'BARBELL', 'BEGINNER', 'WRIST_CURL', 'Flexão de punho para os flexores do antebraço.', 'Sente-se e apoie os antebraços nas coxas com as palmas para cima.
Deixe a barra rolar até os dedos.
Flexione os punhos levantando a barra.
Desça devagar.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('rosca-punho-invertida', 'Rosca de punho invertida', (SELECT id FROM muscle_groups WHERE slug = 'forearms'), 'BARBELL', 'BEGINNER', 'WRIST_CURL', 'Extensão de punho para os extensores do antebraço.', 'Apoie os antebraços nas coxas com as palmas para baixo.
Estenda os punhos levantando a barra.
Pause no topo.
Desça controlando.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('rosca-inversa', 'Rosca inversa', (SELECT id FROM muscle_groups WHERE slug = 'forearms'), 'BARBELL', 'INTERMEDIATE', 'CURL', 'Rosca com pegada pronada que trabalha braquiorradial e extensores.', 'Segure a barra com as palmas viradas para baixo.
Flexione os cotovelos mantendo os punhos retos.
Suba até a altura dos ombros.
Desça devagar.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'rosca-inversa'), (SELECT id FROM muscle_groups WHERE slug = 'biceps'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('farmer-walk', 'Caminhada do fazendeiro', (SELECT id FROM muscle_groups WHERE slug = 'forearms'), 'DUMBBELL', 'BEGINNER', 'SHRUG', 'Exercício de pegada e estabilidade carregando peso pesado.', 'Segure um halter pesado em cada mão.
Mantenha o tronco ereto e os ombros para trás.
Caminhe com passos curtos e firmes.
Mantenha a pegada firme durante todo o percurso.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'farmer-walk'), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'farmer-walk'), (SELECT id FROM muscle_groups WHERE slug = 'abs'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('abdominal-supra', 'Abdominal supra', (SELECT id FROM muscle_groups WHERE slug = 'abs'), 'BODYWEIGHT', 'BEGINNER', 'CRUNCH', 'Flexão de tronco clássica para o reto abdominal.', 'Deite de costas com os joelhos flexionados.
Coloque as mãos ao lado da cabeça sem puxar o pescoço.
Eleve os ombros do chão contraindo o abdômen.
Desça devagar.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('prancha', 'Prancha', (SELECT id FROM muscle_groups WHERE slug = 'abs'), 'BODYWEIGHT', 'BEGINNER', 'PLANK', 'Exercício isométrico para estabilidade de todo o core.', 'Apoie os antebraços no chão com os cotovelos abaixo dos ombros.
Estenda as pernas e mantenha o corpo reto.
Contraia abdômen e glúteos.
Mantenha a posição respirando normalmente (registre os segundos nas repetições).');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'prancha'), (SELECT id FROM muscle_groups WHERE slug = 'shoulders'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'prancha'), (SELECT id FROM muscle_groups WHERE slug = 'glutes'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('elevacao-pernas', 'Elevação de pernas', (SELECT id FROM muscle_groups WHERE slug = 'abs'), 'BODYWEIGHT', 'INTERMEDIATE', 'LEG_RAISE', 'Trabalha a porção inferior do abdômen.', 'Deite de costas com as pernas estendidas.
Mantenha a lombar colada ao chão.
Eleve as pernas até 90°.
Desça devagar sem tocar o chão.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('abdominal-cabo', 'Abdominal no cabo', (SELECT id FROM muscle_groups WHERE slug = 'abs'), 'CABLE', 'INTERMEDIATE', 'CRUNCH', 'Abdominal ajoelhado na polia alta, permite progressão de carga.', 'Ajoelhe de frente para a polia segurando a corda ao lado da cabeça.
Flexione o tronco levando os cotovelos aos joelhos.
Contraia o abdômen.
Retorne devagar.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('abdominal-infra-barra', 'Elevação de joelhos na barra', (SELECT id FROM muscle_groups WHERE slug = 'abs'), 'BODYWEIGHT', 'ADVANCED', 'LEG_RAISE', 'Elevação de joelhos pendurado, desafiadora para o core.', 'Pendure-se na barra com os braços estendidos.
Eleve os joelhos em direção ao peito.
Evite balançar o corpo.
Desça controlando.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'abdominal-infra-barra'), (SELECT id FROM muscle_groups WHERE slug = 'forearms'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('abdominal-maquina', 'Abdominal na máquina', (SELECT id FROM muscle_groups WHERE slug = 'abs'), 'MACHINE', 'BEGINNER', 'CRUNCH', 'Flexão de tronco guiada com carga ajustável.', 'Ajuste o assento e segure as alças.
Flexione o tronco contraindo o abdômen.
Pause na contração.
Retorne devagar.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('abdominal-bicicleta', 'Abdominal bicicleta', (SELECT id FROM muscle_groups WHERE slug = 'abs'), 'BODYWEIGHT', 'BEGINNER', 'CRUNCH', 'Abdominal com rotação que trabalha reto abdominal e oblíquos.', 'Deite de costas com as mãos atrás da cabeça.
Leve o cotovelo direito ao joelho esquerdo estendendo a outra perna.
Alterne os lados em ritmo controlado.
Conte cada lado como uma repetição.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('agachamento-livre', 'Agachamento livre', (SELECT id FROM muscle_groups WHERE slug = 'quads'), 'BARBELL', 'INTERMEDIATE', 'SQUAT', 'O rei dos exercícios de perna, trabalha toda a musculatura inferior.', 'Posicione a barra sobre o trapézio e os pés na largura dos ombros.
Mantenha o peito aberto e a coluna neutra.
Desça flexionando joelhos e quadril até as coxas ficarem paralelas ao chão.
Empurre o chão e suba estendendo as pernas.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'agachamento-livre'), (SELECT id FROM muscle_groups WHERE slug = 'glutes'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'agachamento-livre'), (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'agachamento-livre'), (SELECT id FROM muscle_groups WHERE slug = 'abs'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('leg-press', 'Leg press 45°', (SELECT id FROM muscle_groups WHERE slug = 'quads'), 'MACHINE', 'BEGINNER', 'LEG_PRESS', 'Exercício guiado para quadríceps e glúteos com cargas elevadas.', 'Sente-se no aparelho com os pés no meio da plataforma.
Destrave a plataforma e desça flexionando os joelhos.
Não deixe o quadril sair do encosto.
Empurre a plataforma sem travar os joelhos.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'leg-press'), (SELECT id FROM muscle_groups WHERE slug = 'glutes'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'leg-press'), (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('cadeira-extensora', 'Cadeira extensora', (SELECT id FROM muscle_groups WHERE slug = 'quads'), 'MACHINE', 'BEGINNER', 'LEG_EXTENSION', 'Isolador do quadríceps.', 'Ajuste o encosto para que os joelhos fiquem alinhados ao eixo da máquina.
Posicione o apoio acima dos tornozelos.
Estenda os joelhos contraindo o quadríceps.
Desça devagar.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('afundo', 'Afundo com halteres', (SELECT id FROM muscle_groups WHERE slug = 'quads'), 'DUMBBELL', 'INTERMEDIATE', 'LUNGE', 'Exercício unilateral para pernas e glúteos que melhora equilíbrio.', 'Segure um halter em cada mão.
Dê um passo à frente e desça até os dois joelhos ficarem a 90°.
Mantenha o tronco ereto.
Empurre com a perna da frente para voltar.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'afundo'), (SELECT id FROM muscle_groups WHERE slug = 'glutes'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'afundo'), (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('agachamento-bulgaro', 'Agachamento búlgaro', (SELECT id FROM muscle_groups WHERE slug = 'quads'), 'DUMBBELL', 'ADVANCED', 'LUNGE', 'Agachamento unilateral com o pé de trás apoiado no banco.', 'Apoie o peito do pé de trás em um banco.
Desça flexionando o joelho da frente.
Mantenha o joelho alinhado ao pé.
Suba empurrando com a perna da frente.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'agachamento-bulgaro'), (SELECT id FROM muscle_groups WHERE slug = 'glutes'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('hack-squat', 'Hack squat', (SELECT id FROM muscle_groups WHERE slug = 'quads'), 'MACHINE', 'INTERMEDIATE', 'SQUAT', 'Agachamento guiado com grande ênfase no quadríceps.', 'Apoie as costas e os ombros no aparelho.
Posicione os pés no meio da plataforma.
Desça até os joelhos passarem de 90°.
Suba empurrando a plataforma.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'hack-squat'), (SELECT id FROM muscle_groups WHERE slug = 'glutes'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('agachamento-goblet', 'Agachamento goblet', (SELECT id FROM muscle_groups WHERE slug = 'quads'), 'KETTLEBELL', 'BEGINNER', 'SQUAT', 'Agachamento segurando o peso à frente do peito, ótimo para aprender o padrão.', 'Segure o kettlebell junto ao peito.
Afaste os pés na largura dos ombros.
Agache mantendo o tronco ereto.
Suba empurrando o chão.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'agachamento-goblet'), (SELECT id FROM muscle_groups WHERE slug = 'glutes'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'agachamento-goblet'), (SELECT id FROM muscle_groups WHERE slug = 'abs'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('agachamento-smith', 'Agachamento no Smith', (SELECT id FROM muscle_groups WHERE slug = 'quads'), 'SMITH', 'BEGINNER', 'SQUAT', 'Agachamento guiado pela barra do Smith.', 'Posicione a barra no trapézio e os pés levemente à frente.
Destrave a barra.
Desça até as coxas ficarem paralelas.
Suba estendendo as pernas.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'agachamento-smith'), (SELECT id FROM muscle_groups WHERE slug = 'glutes'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('mesa-flexora', 'Mesa flexora', (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'), 'MACHINE', 'BEGINNER', 'LEG_CURL', 'Isolador dos isquiotibiais deitado.', 'Deite de bruços com o apoio acima dos calcanhares.
Flexione os joelhos levando os calcanhares ao glúteo.
Mantenha o quadril no banco.
Desça devagar.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'mesa-flexora'), (SELECT id FROM muscle_groups WHERE slug = 'calves'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('cadeira-flexora', 'Cadeira flexora', (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'), 'MACHINE', 'BEGINNER', 'LEG_CURL', 'Flexão de joelhos sentado com grande alongamento do posterior.', 'Sente-se com o apoio atrás dos tornozelos.
Prenda as coxas sob o apoio superior.
Flexione os joelhos.
Retorne controlando.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('stiff', 'Stiff com barra', (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'), 'BARBELL', 'INTERMEDIATE', 'RDL', 'Flexão de quadril com joelhos quase estendidos, enfatizando o posterior de coxa.', 'Segure a barra à frente das coxas.
Mantenha os joelhos levemente flexionados.
Leve o quadril para trás descendo a barra rente às pernas.
Suba contraindo glúteos e posterior.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'stiff'), (SELECT id FROM muscle_groups WHERE slug = 'glutes'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'stiff'), (SELECT id FROM muscle_groups WHERE slug = 'back'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('levantamento-terra-romeno', 'Levantamento terra romeno', (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'), 'DUMBBELL', 'INTERMEDIATE', 'RDL', 'Variação com halteres do terra romeno.', 'Segure os halteres à frente das coxas.
Empurre o quadril para trás mantendo a coluna neutra.
Desça até sentir o alongamento do posterior.
Volte estendendo o quadril.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'levantamento-terra-romeno'), (SELECT id FROM muscle_groups WHERE slug = 'glutes'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'levantamento-terra-romeno'), (SELECT id FROM muscle_groups WHERE slug = 'back'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('good-morning', 'Good morning', (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'), 'BARBELL', 'ADVANCED', 'RDL', 'Flexão de quadril com barra nas costas.', 'Posicione a barra sobre o trapézio.
Flexione levemente os joelhos.
Incline o tronco à frente empurrando o quadril para trás.
Retorne à posição ereta.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'good-morning'), (SELECT id FROM muscle_groups WHERE slug = 'glutes'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'good-morning'), (SELECT id FROM muscle_groups WHERE slug = 'back'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('flexora-em-pe', 'Flexora em pé', (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'), 'MACHINE', 'BEGINNER', 'LEG_CURL', 'Flexão unilateral de joelho em pé.', 'Apoie-se no aparelho com o apoio atrás do tornozelo.
Flexione o joelho levando o calcanhar ao glúteo.
Pause na contração.
Desça devagar.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('elevacao-pelvica', 'Elevação pélvica', (SELECT id FROM muscle_groups WHERE slug = 'glutes'), 'BARBELL', 'INTERMEDIATE', 'HIP_THRUST', 'O exercício mais eficiente para ativação dos glúteos.', 'Apoie a parte alta das costas no banco com a barra sobre o quadril.
Pés firmes no chão na largura do quadril.
Eleve o quadril até o tronco ficar alinhado às coxas.
Contraia os glúteos e desça controlando.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'elevacao-pelvica'), (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('gluteo-cabo', 'Glúteo no cabo', (SELECT id FROM muscle_groups WHERE slug = 'glutes'), 'CABLE', 'BEGINNER', 'KICKBACK', 'Extensão de quadril no cabo para isolar os glúteos.', 'Prenda a caneleira no tornozelo e fique de frente para a polia.
Leve a perna para trás estendendo o quadril.
Contraia o glúteo no final.
Retorne devagar.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'gluteo-cabo'), (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('gluteo-quatro-apoios', 'Glúteo quatro apoios', (SELECT id FROM muscle_groups WHERE slug = 'glutes'), 'BODYWEIGHT', 'BEGINNER', 'KICKBACK', 'Coice de glúteo no solo, simples e eficiente.', 'Fique em quatro apoios com as mãos abaixo dos ombros.
Eleve uma perna para trás com o joelho flexionado.
Contraia o glúteo no topo.
Retorne sem apoiar o joelho.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'gluteo-quatro-apoios'), (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('ponte-gluteo', 'Ponte de glúteo', (SELECT id FROM muscle_groups WHERE slug = 'glutes'), 'BODYWEIGHT', 'BEGINNER', 'HIP_THRUST', 'Elevação de quadril no solo, ideal para iniciantes.', 'Deite de costas com os joelhos flexionados.
Eleve o quadril contraindo os glúteos.
Mantenha por um segundo no topo.
Desça devagar.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'ponte-gluteo'), (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('cadeira-abdutora', 'Cadeira abdutora', (SELECT id FROM muscle_groups WHERE slug = 'glutes'), 'MACHINE', 'BEGINNER', 'ABDUCTION', 'Abdução de quadril para glúteo médio.', 'Sente-se com os apoios na parte externa dos joelhos.
Abra as pernas contra a resistência.
Pause na abertura máxima.
Retorne controlando.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('agachamento-sumo', 'Agachamento sumô', (SELECT id FROM muscle_groups WHERE slug = 'glutes'), 'DUMBBELL', 'BEGINNER', 'SQUAT', 'Agachamento com base larga que enfatiza glúteos e adutores.', 'Afaste bem os pés com as pontas viradas para fora.
Segure um halter entre as pernas.
Agache mantendo o tronco ereto.
Suba contraindo os glúteos.');
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'agachamento-sumo'), (SELECT id FROM muscle_groups WHERE slug = 'quads'));
INSERT INTO exercise_secondary_muscles (exercise_id, muscle_group_id) VALUES ((SELECT id FROM exercises WHERE slug = 'agachamento-sumo'), (SELECT id FROM muscle_groups WHERE slug = 'hamstrings'));
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('panturrilha-em-pe', 'Panturrilha em pé', (SELECT id FROM muscle_groups WHERE slug = 'calves'), 'MACHINE', 'BEGINNER', 'CALF_RAISE', 'Flexão plantar em pé para gastrocnêmio.', 'Posicione os ombros sob o apoio e a ponta dos pés na plataforma.
Desça os calcanhares até alongar.
Suba ficando na ponta dos pés.
Pause no topo e desça devagar.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('panturrilha-sentado', 'Panturrilha sentado', (SELECT id FROM muscle_groups WHERE slug = 'calves'), 'MACHINE', 'BEGINNER', 'SEATED_CALF', 'Flexão plantar sentado com ênfase no sóleo.', 'Sente-se com o apoio sobre os joelhos.
Apoie a ponta dos pés na plataforma.
Eleve os calcanhares o máximo possível.
Desça até alongar.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('panturrilha-leg-press', 'Panturrilha no leg press', (SELECT id FROM muscle_groups WHERE slug = 'calves'), 'MACHINE', 'BEGINNER', 'LEG_PRESS', 'Flexão plantar utilizando a plataforma do leg press.', 'Sente-se no leg press com a ponta dos pés na borda da plataforma.
Mantenha os joelhos estendidos.
Empurre a plataforma com a ponta dos pés.
Retorne alongando a panturrilha.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('panturrilha-unilateral', 'Panturrilha unilateral com halter', (SELECT id FROM muscle_groups WHERE slug = 'calves'), 'DUMBBELL', 'INTERMEDIATE', 'CALF_RAISE', 'Flexão plantar unilateral em um degrau.', 'Apoie a ponta de um pé em um degrau segurando um halter.
Desça o calcanhar abaixo do degrau.
Suba na ponta do pé.
Repita e troque de perna.');
INSERT INTO exercises (slug, name, primary_muscle_id, equipment, difficulty, movement, description, instructions) VALUES ('panturrilha-smith', 'Panturrilha no Smith', (SELECT id FROM muscle_groups WHERE slug = 'calves'), 'SMITH', 'BEGINNER', 'CALF_RAISE', 'Flexão plantar em pé com a barra guiada.', 'Posicione a barra sobre o trapézio e a ponta dos pés em uma anilha.
Suba na ponta dos pés.
Pause no topo.
Desça alongando.');
