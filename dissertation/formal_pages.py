"""
Formal / preliminary pages: Title, Declaration, Certificate, Acknowledgement,
Abstract, Table of Contents, List of Figures, List of Abbreviations.
"""
from config import (
    doc, add_heading_styled as add_h, add_para as add_p,
    add_table, page_break,
    Pt, RGBColor, WD_ALIGN_PARAGRAPH
)


def build_title_page():
    doc.add_paragraph("\n\n\n")
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r1 = p.add_run("UPSCALE PRO\n")
    r1.bold = True
    r1.font.size = Pt(26)
    r1.font.name = 'Times New Roman'
    r2 = p.add_run("An AI-Powered Serverless Image Upscaling Platform\n\n")
    r2.font.size = Pt(14)
    r2.font.name = 'Times New Roman'
    r2.italic = True
    r3 = p.add_run("DISSERTATION / MAJOR PROJECT REPORT\n\n\n")
    r3.font.size = Pt(14)
    r3.font.name = 'Times New Roman'

    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.line_spacing = 1.8
    p2.add_run("Submitted by:\n").font.size = Pt(12)
    r_name = p2.add_run("AMIR SHAMIM\n")
    r_name.bold = True
    r_name.font.size = Pt(14)
    p2.add_run("Enrollment No: 2023-301-021\n\n").font.size = Pt(12)
    p2.add_run("In partial fulfilment for the award of the degree of\n").font.size = Pt(12)
    r_deg = p2.add_run("BACHELOR OF COMPUTER APPLICATION (BCA)\n\n")
    r_deg.bold = True
    r_deg.font.size = Pt(13)
    p2.add_run("Under the supervision of:\n").font.size = Pt(12)
    r_sup = p2.add_run("Dr. Sapna Jain\n\n")
    r_sup.bold = True
    r_sup.font.size = Pt(13)

    p3 = doc.add_paragraph()
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p3.add_run("Department of Computer Science & Technology\n").font.size = Pt(12)
    r_uni = p3.add_run("JAMIA HAMDARD\n")
    r_uni.bold = True
    r_uni.font.size = Pt(14)
    p3.add_run("New Delhi – 110062\n").font.size = Pt(12)
    p3.add_run("(2026)").font.size = Pt(12)
    page_break()


def build_declaration():
    add_h("DECLARATION", 1)
    add_p(
        'I, Amir Shamim, a student of Bachelor of Computer Application (BCA), '
        'Enrollment No: 2023-301-021, hereby declare that the dissertation entitled '
        '\u201cUpscale Pro: An AI-Powered Serverless Image Upscaling Platform\u201d '
        'which is being submitted by me to the Department of Computer Science, '
        'Jamia Hamdard, New Delhi, in partial fulfilment of the requirement for '
        'the award of the degree of Bachelor of Computer Application, is my original '
        'work and has not been submitted anywhere else for the award of any Degree, '
        'Diploma, Associateship, Fellowship, or other similar title or recognition.'
    )
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(36)
    p.add_run("\nDate: April, 2026\n").bold = True
    p.add_run("Place: New Delhi\n\n").bold = True
    r = p.add_run("Amir Shamim")
    r.bold = True
    r.font.size = Pt(13)
    page_break()


def build_certificate():
    p_header = doc.add_paragraph()
    p_header.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_header.paragraph_format.space_after = Pt(4)
    r1 = p_header.add_run("JAMIA HAMDARD (Hamdard University)\n")
    r1.bold = True
    r1.font.size = Pt(14)
    p_header.add_run(
        "(Deemed-to-be University under Section 3 of the UGC Act, 1956)\n"
        "Accredited by NAAC in 'A' Category\n"
        "HAMDARD NAGAR, NEW DELHI – 110062\n"
    ).font.size = Pt(11)

    add_h("CERTIFICATE", 1)
    add_p(
        'On the basis of the declaration submitted by Mr. Amir Shamim '
        '(Enrollment No: 2023-301-021), a student of Bachelor of Computer Application (BCA), '
        'I hereby certify that the dissertation entitled \u201cUpscale Pro: An AI-Powered '
        'Serverless Image Upscaling Platform\u201d being submitted to the Department of '
        'Computer Science & Technology, Jamia Hamdard, New Delhi, in partial fulfilment '
        'of the requirement for the award of the degree of Bachelor of Computer Application, '
        'is carried out by him under my supervision.'
    )
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(48)
    p.paragraph_format.line_spacing = 2.0
    p.add_run("Dr. Sapna Jain\n").bold = True
    p.add_run("(Supervisor)\n\n")
    p.add_run("Head, Department of Computer Science\n").bold = True
    page_break()


def build_acknowledgement():
    add_h("ACKNOWLEDGEMENT", 1)
    add_p(
        "It is a pleasure to acknowledge the many individuals who knowingly and "
        "unknowingly helped me to complete this project. First and foremost, I thank "
        "the Almighty for all the blessings that carried me through these years of study."
    )
    add_p(
        "I extend my deepest gratitude to Dr. Sapna Jain Ma'am, my project supervisor, "
        "who has consistently supported, guided, and encouraged me to explore advanced "
        "cloud computing paradigms and artificial intelligence techniques. Her expertise "
        "in evaluating system architectures and her patient mentorship at every stage of "
        "development proved invaluable. The insights she provided regarding scalable "
        "microservice patterns and serverless deployment strategies were instrumental in "
        "shaping the final architecture of Upscale Pro."
    )
    add_p(
        "I also extend my sincere thanks to the faculty members of the Department of "
        "Computer Science & Technology at Jamia Hamdard for cultivating a rigorous "
        "academic environment. Their lectures on database management, software engineering, "
        "and network security laid the theoretical foundation upon which this project was built."
    )
    add_p(
        "I am grateful to the non-teaching staff who ensured uninterrupted access to "
        "laboratory resources and internet connectivity throughout the development cycle."
    )
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(24)
    p.add_run("\nAmir Shamim\n").bold = True
    p.add_run("Enrollment No: 2023-301-021").bold = True
    page_break()


def build_abstract():
    add_h("ABSTRACT", 1)
    add_p(
        "Digital imagery forms the backbone of modern web communication, spanning domains "
        "from electronic commerce product photography to social media content and archival "
        "digitisation. However, a substantial portion of existing digital media suffers from "
        "low spatial resolution caused by hardware constraints on capture devices, aggressive "
        "lossy compression algorithms employed by messaging platforms, and bandwidth "
        "limitations during file transmission. When these degraded images are rendered on "
        "contemporary high-density displays such as 4K monitors or Retina screens, the "
        "absence of sufficient pixel information manifests as visible blocking artefacts, "
        "colour banding, and perceptual blurriness."
    )
    add_p(
        "Conventional upsampling techniques, including nearest-neighbour interpolation, "
        "bilinear filtering, and bicubic convolution, attempt to synthesise missing pixel "
        "values by averaging neighbouring samples in the spatial domain. While computationally "
        "inexpensive, these algorithms are fundamentally limited because they operate without "
        "any semantic understanding of image content. Consequently, they fail to reconstruct "
        "high-frequency textural details such as hair strands, fabric weaves, or architectural "
        "edges, producing outputs that appear smooth yet visually unconvincing."
    )
    add_p(
        "This dissertation presents Upscale Pro, a production-grade Software as a Service "
        "(SaaS) platform that democratises access to state-of-the-art neural super-resolution. "
        "The system deploys two specialised variants of the Real-ESRGAN architecture "
        "\u2014 Real-ESRGAN Pro for photographic content and Real-ESRGAN Anime for illustration "
        "and digital art \u2014 both trained on synthetic degradation pipelines that model "
        "real-world image corruption. To address the prohibitive cost of maintaining dedicated "
        "GPU infrastructure, Upscale Pro implements a strictly decoupled three-tier architecture: "
        "a React.js single-page application communicates with a Node.js API gateway hosted on "
        "DigitalOcean, which dispatches inference requests to ephemeral NVIDIA T4 GPU containers "
        "provisioned on-demand through Modal.com. Processed images are uploaded directly from "
        "the GPU container to a Cloudinary Content Delivery Network, eliminating binary buffer "
        "transfer through the web server and preventing heap memory exhaustion. The resulting "
        "system achieves an average end-to-end latency of under ten seconds per image while "
        "maintaining near-zero idle infrastructure cost."
    )
    page_break()


def build_table_of_contents():
    add_h("TABLE OF CONTENTS", 1)
    toc_entries = [
        ("", "Declaration", "i"),
        ("", "Certificate", "ii"),
        ("", "Acknowledgement", "iii"),
        ("", "Abstract", "iv"),
        ("", "Table of Contents", "v"),
        ("", "List of Figures and Tables", "vi"),
        ("", "List of Abbreviations", "vii"),
        ("Chapter 1", "Introduction", "1"),
        ("", "1.1 Background and Motivation", "1"),
        ("", "1.2 The Upscale Pro Solution", "2"),
        ("", "1.3 Scope of the Project", "3"),
        ("Chapter 2", "Objectives", "4"),
        ("Chapter 3", "Problem Analysis and Related Work", "5"),
        ("", "3.1 The Quality Bottleneck", "5"),
        ("", "3.2 The Infrastructure Bottleneck", "6"),
        ("", "3.3 Comparative Analysis of Existing Systems", "7"),
        ("Chapter 4", "Feasibility Study", "8"),
        ("", "4.1 Economic Feasibility", "8"),
        ("", "4.2 Technical Feasibility", "9"),
        ("", "4.3 Operational Feasibility", "9"),
        ("Chapter 5", "Technology and Platform Overview", "10"),
        ("", "5.1 Software Requirements", "10"),
        ("", "5.2 Hardware Requirements", "10"),
        ("", "5.3 Software Configuration", "11"),
        ("", "5.4 Technology Features and Justification", "11"),
        ("Chapter 6", "Software Requirement Specification", "14"),
        ("", "6.1 Functional Requirements", "14"),
        ("", "6.2 Non-Functional Requirements", "15"),
        ("Chapter 7", "System Analysis and Design", "16"),
        ("", "7.1 Context Level DFD (Level 0)", "16"),
        ("", "7.2 Level 1 DFD", "17"),
        ("", "7.3 Entity Relationship Diagram", "18"),
        ("Chapter 8", "Implementation and Results", "19"),
        ("", "8.1 Project Initialisation and Setup", "19"),
        ("", "8.2 Application Walkthrough with Snapshots", "21"),
        ("Chapter 9", "Software Testing", "26"),
        ("Chapter 10", "Conclusion", "28"),
        ("Chapter 11", "Limitations and Future Scope", "29"),
        ("", "References", "30"),
    ]
    table = doc.add_table(rows=len(toc_entries), cols=3)
    table.columns[0].width = Pt(80)
    table.columns[1].width = Pt(320)
    table.columns[2].width = Pt(50)
    for i, (ch, title, pg) in enumerate(toc_entries):
        row = table.rows[i]
        for ci, val in enumerate([ch, title, pg]):
            cell = row.cells[ci]
            cell.text = val
            for para in cell.paragraphs:
                para.paragraph_format.space_after = Pt(2)
                for run in para.runs:
                    run.font.name = 'Times New Roman'
                    run.font.size = Pt(11)
                    if ch.startswith("Chapter"):
                        run.bold = True
    page_break()


def build_list_of_figures():
    add_h("LIST OF FIGURES AND TABLES", 1)
    figures = [
        ("Fig. 5.1", "Comparison: Bicubic Interpolation vs. GAN Super-Resolution", "5"),
        ("Fig. 5.2", "Real-ESRGAN Degradation Pipeline (Wang et al., 2021)", "6"),
        ("Fig. 7.1", "Context Level Data Flow Diagram (Level 0)", "16"),
        ("Fig. 7.2", "Level 1 Data Flow Diagram", "17"),
        ("Fig. 7.3", "Entity Relationship Diagram for Upscale Pro", "18"),
        ("Fig. 8.1", "Project directory structure in VS Code", "19"),
        ("Fig. 8.2", "Node.js backend server startup in terminal", "20"),
        ("Fig. 8.3", "React development server running on localhost", "20"),
        ("Fig. 8.4", "Upscale Pro Landing Page (Hero Section)", "21"),
        ("Fig. 8.5", "User Registration and Login Modal", "21"),
        ("Fig. 8.6", "Email Verification Modal", "22"),
        ("Fig. 8.7", "Image Upload Interface on Upscale Page", "22"),
        ("Fig. 8.8", "AI Processing State with Progress Indicator", "23"),
        ("Fig. 8.9", "Before-and-After Comparison Slider (Photo)", "23"),
        ("Fig. 8.10", "Before-and-After Comparison Slider (Anime)", "24"),
        ("Fig. 8.11", "Subscription Tier and Pricing Page", "24"),
        ("Fig. 8.12", "User Profile and Usage Analytics Dashboard", "25"),
        ("Fig. 8.13", "Batch Processing Interface", "25"),
        ("Fig. 8.14", "Responsive Mobile Layout", "26"),
    ]
    table = doc.add_table(rows=len(figures) + 1, cols=3)
    headers = ["Figure No.", "Description", "Page"]
    for ci, h in enumerate(headers):
        cell = table.rows[0].cells[ci]
        cell.text = h
        for para in cell.paragraphs:
            for run in para.runs:
                run.bold = True
                run.font.name = 'Times New Roman'
                run.font.size = Pt(11)
    for ri, (fno, desc, pg) in enumerate(figures):
        for ci, val in enumerate([fno, desc, pg]):
            cell = table.rows[ri+1].cells[ci]
            cell.text = val
            for para in cell.paragraphs:
                for run in para.runs:
                    run.font.name = 'Times New Roman'
                    run.font.size = Pt(11)

    add_p("")  # spacing
    # Tables list
    add_p("Table 5.1: Comparative Analysis of Existing Image Upscaling Platforms ... 7", bold=True)
    add_p("Table 5.3: Software Requirements Specification ... 10", bold=True)
    add_p("Table 5.4: Hardware Requirements Specification ... 10", bold=True)
    page_break()


def build_list_of_abbreviations():
    add_h("LIST OF ABBREVIATIONS", 1)
    abbrevs = [
        ("AI", "Artificial Intelligence"),
        ("API", "Application Programming Interface"),
        ("CDN", "Content Delivery Network"),
        ("CPU", "Central Processing Unit"),
        ("CSS", "Cascading Style Sheets"),
        ("DFD", "Data Flow Diagram"),
        ("DOM", "Document Object Model"),
        ("ER", "Entity Relationship"),
        ("GAN", "Generative Adversarial Network"),
        ("GPU", "Graphics Processing Unit"),
        ("HTML", "Hyper Text Markup Language"),
        ("HTTP", "Hyper Text Transfer Protocol"),
        ("IEEE", "Institute of Electrical and Electronics Engineers"),
        ("JPEG", "Joint Photographic Experts Group"),
        ("JSON", "JavaScript Object Notation"),
        ("JWT", "JSON Web Token"),
        ("MIME", "Multipurpose Internet Mail Extensions"),
        ("OOM", "Out of Memory"),
        ("PNG", "Portable Network Graphics"),
        ("REST", "Representational State Transfer"),
        ("RPC", "Remote Procedure Call"),
        ("SaaS", "Software as a Service"),
        ("SQL", "Structured Query Language"),
        ("SRS", "Software Requirement Specification"),
        ("UI", "User Interface"),
        ("URL", "Uniform Resource Locator"),
        ("VRAM", "Video Random Access Memory"),
    ]
    table = doc.add_table(rows=len(abbrevs) + 1, cols=2)
    for ci, h in enumerate(["Abbreviation", "Full Form"]):
        cell = table.rows[0].cells[ci]
        cell.text = h
        for para in cell.paragraphs:
            for run in para.runs:
                run.bold = True
                run.font.name = 'Times New Roman'
                run.font.size = Pt(11)
    for ri, (abbr, full) in enumerate(abbrevs):
        for ci, val in enumerate([abbr, full]):
            cell = table.rows[ri+1].cells[ci]
            cell.text = val
            for para in cell.paragraphs:
                for run in para.runs:
                    run.font.name = 'Times New Roman'
                    run.font.size = Pt(11)
    page_break()


def build_all_formal_pages():
    """Entry point: generates all preliminary pages in order."""
    build_title_page()
    build_declaration()
    build_certificate()
    build_acknowledgement()
    build_abstract()
    build_table_of_contents()
    build_list_of_figures()
    build_list_of_abbreviations()
