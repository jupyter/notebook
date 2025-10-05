from docx import Document
from docx.shared import Pt

# Crear documento Word
doc = Document()

# Establecer estilo de fuente Arial 11 para texto normal
style = doc.styles['Normal']
font = style.font
font.name = 'Arial'
font.size = Pt(11)

# Función para agregar títulos y subtítulos en Arial 12 negrita
def add_title(text):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = True
    run.font.size = Pt(12)
    run.font.name = 'Arial'

# Agregar contenido inicial del tema 1
add_title("1. Métodos de diagnóstico para enfermedades relacionadas con el metabolismo")
doc.add_paragraph(
    "Las enfermedades metabólicas comprenden un grupo amplio de condiciones médicas que afectan la manera en que el cuerpo "
    "convierte los alimentos en energía. Estas enfermedades pueden ser hereditarias o adquiridas, y muchas de ellas están "
    "relacionadas con el estilo de vida moderno, como el sedentarismo y una dieta alta en azúcares y grasas."
)

add_title("1.1 Introducción al metabolismo y su relación con la salud")
doc.add_paragraph(
    "El metabolismo es el conjunto de procesos físicos y químicos que ocurren en las células del cuerpo para convertir los "
    "nutrientes en energía. Un metabolismo saludable permite al organismo mantener sus funciones vitales, como la respiración, "
    "la digestión, la regulación de la temperatura corporal y la reparación celular.\n\n"
    "Cuando existen alteraciones en estos procesos, pueden desarrollarse enfermedades metabólicas como:\n"
    "- Diabetes Mellitus\n"
    "- Hipercolesterolemia\n"
    "- Síndrome metabólico\n"
    "- Hipotiroidismo\n"
    "- Enfermedades mitocondriales"
)

add_title("1.2 Principales métodos de diagnóstico")
doc.add_paragraph(
    "El diagnóstico oportuno de estas enfermedades es fundamental para su control y tratamiento. Los métodos diagnósticos más "
    "utilizados incluyen:"
)

add_title("1.2.1 Pruebas de laboratorio")
doc.add_paragraph(
    "Las pruebas de laboratorio son el pilar para el diagnóstico de enfermedades metabólicas. Entre las más comunes están:\n"
    "- Glucosa en sangre: utilizada para detectar hiperglucemia o hipoglucemia.\n"
    "- Hemoglobina glicosilada (HbA1c): refleja los niveles promedio de glucosa en los últimos tres meses.\n"
    "- Perfil lipídico: mide colesterol total, HDL, LDL y triglicéridos.\n"
    "- Pruebas de función tiroidea: como TSH, T3 y T4.\n"
    "- Pruebas genéticas: en enfermedades metabólicas hereditarias."
)

add_title("1.2.2 Evaluación clínica")
doc.add_paragraph(
    "El examen físico y la historia clínica detallada son esenciales. Algunos signos clínicos que pueden orientar al diagnóstico incluyen:\n"
    "- Aumento o pérdida de peso sin causa aparente.\n"
    "- Fatiga crónica.\n"
    "- Cambios en el apetito.\n"
    "- Alteraciones en la piel, como sequedad o pigmentaciones.\n"
    "- Síntomas neurológicos como confusión o convulsiones."
)

add_title("1.2.3 Estudios de imagen")
doc.add_paragraph(
    "Aunque no siempre se utilizan de manera rutinaria, algunas enfermedades metabólicas requieren estudios de imagen, como:\n"
    "- Ultrasonido abdominal: para evaluar el hígado graso o lesiones pancreáticas.\n"
    "- Resonancia magnética: útil en enfermedades mitocondriales o neurológicas metabólicas.\n"
    "- Densitometría ósea: en trastornos del metabolismo óseo como la osteoporosis."
)

# Guardar el documento
doc.save("Diagnóstico_Metabolismo_Parte1.docx")
