**Page 1**
Roomate4u: An Online Platform to Provide Accommodation Facilities to Students.
DISSERTATION REPORT. 
Submitted by SHAHID SHABEER MALIK 2020-208-017.
in partial fulfillment for the award of the degree of Bachelor of Technology in Computer Science and Engineering.
Under the supervision of Dr. SAPNA JAIN.
JAMIA HAMDARD.
Department of Computer Science & Engineering.
School of Engineering Sciences & Technology.
JAMIA HAMDARD.
New Delhi-110062.
(2023).

**Page 2**
DECLARATION.
I, Mr. Shahid Shabeer Malik, a student of Bachelor of Technology in Computer Science & Engineering, Enrolment No: 2020-208-017 hereby declares that the dissertation entitled “Roomate4u: An Online Platform to Provide Accommodation Facilities to Students”, which is being submitted by me to the Department of Computer Science, Jamia Hamdard, New Delhi, in partial fulfilment of the requirement for the award of the degree of Bachelor of Technology in Computer Science & Engineering is my original work and has not been submitted anywhere else for the award of any degree, diploma, associateship, fellowship, or other similar title or recognition.
SHAHID SHABEER MALIK.
Date: 24/05/2023.
Place: NEW DELHI.
i.

**Page 3**
JAMIA HAMDARD (Hamdard University).
(Declared as Deemed-to-be University under Section 3 of the UGC Act, 1956 vide Notification No. F.9-18/85-U.3 dated 10.5.1989 of the Government of India).
Accredited by NAAC in 'A' Category.
HAMDARD NAGAR NEW DELHI-110062.
CERTIFICATE.
On the basis of the declaration submitted by Mr. Shahid Shabeer Malik (Enrolment No 2020- 208-017) a student of Bachelor of Technology (Computer Science & Engineering) Lateral Entry, I hereby certify that the dissertation entitle “Roomate4u: An Online Platform to Provide Accommodation Facilities to Students” being submitted to the Department of Computer Science & Engineering, Jamia Hamdard, New Delhi in partial fulfillment of the requirement for the award of the degree of Bachelor of Technology (Computer Science & Engineering) Lateral Entry, is carried out by him under my supervision.
Dr. Sapna Jain (Supervisor).
Dr. Farheen Siddiqui Head, Department of CSE.
ii.

**Page 4**
ACKNOWLEDGEMENT.
I express our deep sense of respect and my gratitude to my supervisor Dr. Sapna Jain. He created a friendly atmosphere, enlightened me with great ideas, and patiently guided me. It was really a lifetime experience for me to work with him, and I would not be able to finish my work without his guidance, support, and direction. He is the epitome of knowledge and wisdom with his practical work for my chosen project problem, with his outstanding vision, crystal clear thought process and razor-sharp analytical approach, he evaluated my work with sheer pace and provided invaluable inputs for further work. I will be indebted throughout my life for his guidance and support.
I extend my thanks to other faculty members and non-teaching staff of Jamia Hamdard for providing all kinds of support.
Name: Shahid Shabeer Malik.
Enrolment No.: 2020-208-017.
iii.

**Page 5**
ABSTRACT.
Every college student knows, how difficult it is to get accommodated in college hostels due to lack of vacancies. The same is the case with Jamia Millia Islamia University and Jamia Hamdard University. Almost every student suffers while finding favourable rooms and flats in nearby localities of the said universities. From ringing the bell of almost every apartment to roaming every nook and corner to find rooms, students suffer a lot in terms of money and time. Some students end up paying a handsome amount of brokerage. Students who need roommates end up paying more rent because they cannot find roommates at the right time. This costs students valuable time and money. In today’s world, almost everyone has a smartphone, and hence, a smartphone can be used efficiently to provide accommodation facilities to students. This Project presents Roomate4U, an online platform that provides accommodation as well as roommate facilities to the students of JMI and Jamia Hamdard University. Only the students of the above-mentioned universities can log in to the system and can easily find favorable rooms and roommates. Roomate4U is an innovative online platform designed to address the accommodation needs of students at Jamia Millia Islamia University and Jamia Hamdard University. The platform serves as a bridge between students seeking rooms and roommates and flat owners in nearby localities with available rooms for rent. Only the students of the above-mentioned universities can log in to the system and can easily find favorable rooms and roommates. With Roomate4U, students no longer have to endure the tedious and time-consuming process of searching for suitable accommodation or paying hefty brokerage fees. Instead, they can easily find and connect with potential roommates and flat owners through the platform. To make the registration process more efficient, Roomate4U uses advanced technologies such as text extraction from images and machine learning. The platform also includes a chatbot that can provide general information and answer common questions. With its user-friendly interface and advanced features, Roomate4U aims to revolutionize the way students find accommodation and make the process more convenient, cost-effective, and stress-free.
iv.

**Page 6**
TABLE OF CONTENTS.
Declaration (Page i).
Certificate (Page ii).
Acknowledgment (Page iii).
Abstract (Page iv).
List of figures and tables (Page viii).
List of Abbreviations (Page ix).
Chapter 1 Introduction (Page 1-3).
1.1 Background (Page 1-2).
1.2 Objective (Page 2).
1.3 Scope (Page 2).
1.4 Motivation (Page 2-3).
Chapter 2 Problem analysis and related work (Page 4-9).
2.1 Problem Analysis (Page 4-8).
2.2 The Problem Found in The Existing Systems. (Page 8).
2.3 Objective and Purpose (Page 8).
2.4 New Feature Included (Page 9).
Chapter 3 Technology/platform overview (Page 10-13).
3.1 Software requirements (Page 10).
3.2 Hardware requirements (Page 11).
3.3 Software configuration (Page 11).
3.4 Software Features (Page 11-12).
3.4.1 Python (Page 11).
3.4.1.1 Features (Page 11).
3.4.1.2 Advantages (Page 12).
3.4.2 Flask (Page 12).
3.4.2.1 Features (Page 12).
3.4.2.2 Advantages (Page 12-13).
v.

**Page 7**
3.4.3 NLTK (Page 13).
3.4.3.1 Features (Page 13).
3.4.3.2 Advantages (Page 13).
3.4.4 MongoDB (Page 13).
3.4.4.1 Features (Page 13-14).
3.4.4.2 Advantages (Page 14).
Chapter 4 System analysis (Page 15-19).
4.1 Data Flow Diagram (Page 16).
4.1.1 Context Level DFD (Page 16-17).
4.1.2 First Level DFD (Page 17).
4.1.3 Second Level DFD (Page 17).
4.2 ER-Diagram (Page 17).
Chapter 5 Implementation and result (Page 20-27).
5.1 Prerequisites For The Code (Page 20).
5.1.1 Sublime (Page 20).
5.1.2 Flask (Page 20).
5.1.3 Bootstrap (Page 20).
5.1.4 Jquery (Page 20).
5.1.5 Mongodb (Page 20).
5.2 Step for Run Application (Page 20).
5.2.1 Starting Server (Page 21).
5.2.2 Connect database (Page 21).
5.3 Output (Page 22).
5.3.2 Home Page with Chatbot (Page 22).
5.3.3 Type of Flats (Page 22-23).
5.3.4 Login and Signup Page (Page 24).
5.3.5 Roommates Page for JMI Students (Page 24).
5.3.6 Roommates Page for JHU Students (Page 25).
5.3.7 Privacy and Terms and Condition Page (Page 25-26).
5.3.8 Admin Page for JMI and JHU Students (Page 26-27).

**Page 8**
Chapter 6 Conclusion and future work (Page 28-29).
6.1 Conclusion (Page 28).
6.2 Limitation (Page 28).
6.3 Security (Page 28-29).
6.4 Future Work (Page 29).
References (Page 30).
vii.

**Page 9**
LIST OF FIGURES AND TABLES.
Fig. 2.1 The Fundamentals Problems Faced by Students (PAGE NO. 5).
Fig. 2.2 The preference is given by students while searching for rooms. (PAGE NO. 6).
Fig. 2.3 The analysis of the preferences given by students while searching for roommates. (PAGE NO. 6).
Fig. 2.4 Requirement for rooms during the different months (PAGE NO. 7).
Fig. 2.5 Students use posters and social media to advertise available rooms and find potential roommates. (PAGE NO. 7).
Fig 4.7 Context Level Diagram (PAGE NO. 17).
Fig 4.8 First-Level Diagram (PAGE NO. 18).
Fig 4.9 Second Level Diagram (PAGE NO. 18).
Fig 4.10 ER-diagram (PAGE NO. 19).
Fig 5.11 Starting Server (PAGE NO. 21).
Fig 5.12 Connecting MongoDB Database (PAGE NO. 21).
Fig 5.13 Home Page with Chatbot (PAGE NO. 22).
Fig 5.14 Page showing available 1BHK rooms. (PAGE NO. 22).
Fig 5.15 Page showing available 2BHK rooms. (PAGE NO. 23).
Fig 5.16 Page showing available 3BHK rooms. (PAGE NO. 23).
Fig 5.17 Login & signup Page (PAGE NO. 24).
Fig 5.18 Roommates Page for JMI Students (PAGE NO. 24).
Fig 5.19 Roommates Page for JHU Students (PAGE NO. 25).
Fig 5.20 Privacy Page (PAGE NO. 25).
Fig 5.21 Terms and Condition Page (PAGE NO. 26).
Fig 5.22 Admin Page for JMI Students (PAGE NO. 26).
Fig 5.23 Admin Page for JMI Students (PAGE NO. 27).
Fig 5.24 Admin Page for JHU Students (PAGE NO. 27).
Table 2.1 Comparatives Analysis table for all related existing platform (PAGE NO. 8).
viii.

**Page 10**
LIST OF ABBREVIATION.
AI - Artificial intelligence.
API - Application Interface.
CSS - Cascading Style Sheets.
Chatbot - A computer program that can simulate conversations with human users.
DBA - Database Administrator.
JHU - Jamia Hamdard University.
JMI - Jamia Millia Islamia University.
ML - Machine learning.
NLTK - Natural Language Toolkit Title of Project.
PG - Paying Guest.
Roomate4u - Title of Project.
UI - User interface.
ix.

**Page 11**
CHAPTER 1 INTRODUCTION.
Finding suitable rooms and roommates has long been a challenge for college students. It entails arduous tasks like extensively searching various locations and approaching multiple apartments. Some students even face the additional burden of paying brokerage fees. Based on our survey, we discovered that 70% of students encounter difficulties during their room search, with 35% resorting to paying brokerage fees. Moreover, we found that 30% of students rely on posting physical posters in their localities to find roommates. Additionally, 70% of students express a preference for sharing rooms with fellow students from the same state. These findings highlight the significant time and effort students waste in the process of finding suitable accommodations and compatible roommates. This is a rising issue and we came up with Roomate4U to counter this problem. This is an online platform that provides accommodation as well as roommate facilities to the students of JMI and Jamia Hamdard University. Roomate4U is an innovative online platform designed to address the accommodation needs of students at Jamia Millia Islamia University and Jamia Hamdard University. The platform serves as a bridge between students seeking rooms and roommates and flat owners in nearby localities with available rooms for rent. Only the students of the above-mentioned universities can log in to the system and can easily find favorable rooms and roommates. With Roomate4U, students no longer have to endure the tedious and time-consuming process of searching for suitable accommodation or paying hefty brokerage fees. Instead, they can easily find and connect with potential roommates and flat owners through the platform. To make the registration process more efficient, Roomate4U uses advanced technologies such as text extraction from images and machine learning. The platform also includes a chatbot that can provide general information and answer common questions. With its user-friendly interface and advanced features, Roomate4U aims to revolutionize the way students find accommodation and make the process more convenient, cost-effective, and stress-free. Students are required to sign up on the system. Once verified by the admin, they gain access to the login and can search for rooms and roommates. This ensures that only students from the specified college can access the roommate section. Similarly, flat owners need to provide necessary details and undergo verification before they can post room information on the platform.
1.1 Background.
To date, many people have created online platforms that provide rooms. Following are some of the already operating websites that are somehow like our project and our project gets background from:.
1.

**Page 12**
1. No Broker: It was made for entire the country. It is not specially made for Jamia Millia Islamia and Jamia Hamdard University students.
2. Rent Mantra: It lacks the roommate facility and additional services that we provide.
3. Magic Bricks: It involves brokers.
1.2 Scope.
The scope of this project is limited to students at Jamia Millia Islamia University and Jamia Hamdard University and flat owners in nearby localities. The project does not include other universities or locations.
1.3 Objective.
The objectives of the Roomate4U project are to:.
1. Develop an online platform that simplifies the search for accommodation and roommates for students at Jamia Millia Islamia University and Jamia Hamdard University.
2. Connect students with available rooms and potential roommates in nearby localities.
3. Save students time and money by eliminating the need for brokerage fees and streamlining the search process.
4. Improve the overall housing experience for college students by providing a user-friendly platform with advanced features.
1.4 Motivation.
The motivation behind the Roomate4U project is to address the challenges faced by college students in finding suitable accommodation. Students at Jamia Millia Islamia University and Jamia Hamdard University often struggle to find affordable rooms and compatible roommates in nearby localities. There is no proper system that provides rooms to the students according to their interests. The students either get rooms by roaming here and there for a long time or the work is done through an intermediate person which costs them very much. Thus making it more complex and more costly to find room for the students. This leads to students in more trouble, cost, and time wastage. The traditional process of searching for accommodation can be time-consuming, expensive, and stressful.
The project is motivated by a desire to make a positive impact on the lives of college students by providing a user-friendly platform that addresses their accommodation needs. By leveraging advanced technologies such as text extraction from images and machine learning, Roomate4U aims to revolutionize the way students find accommodation.
1. Finding room is not easy and more tedious.
2. The systems are not specially made for the students of said universities.
3. They also extra money charged to find rooms.
2.

**Page 13**
4. They do not provide a roommate facility.
5. They involve brokers.
6. There is too much time to find a room.
7. The complexity of the system for payment.
3.

**Page 14**
CHAPTER 2 PROBLEM ANALYSIS AND RELATED WORK.
Finding suitable accommodation and compatible roommates is a common challenge faced by college students. To address this problem, a comprehensive problem analysis and exploration of related work can provide valuable insights.
1. Limited Housing Options: Many college students struggle to find available rooms within their budget and close proximity to their campus. This can lead to increased stress and difficulty in securing suitable accommodation.
2. Compatibility of Roommates: Sharing a living space with compatible roommates is crucial for a positive living experience. However, finding roommates who share similar preferences, lifestyles, and study habits can be challenging.
3. Trust and Safety Concerns: College students often face concerns regarding the safety and reliability of potential roommates and accommodations. Trustworthy information and a reliable verification process are vital to ensure a secure living environment.
2.1 Problem Analysis.
To gain a comprehensive understanding of the issue's gravity, we conducted a survey and conducted personal interviews with a group of 50 students. Fig 2.1 presents the core challenges that students encounter in terms of accommodation. This figure displays the survey results, indicating the percentage of students experiencing specific problems. The survey revealed that 90% of students invested 2-3 weeks in their search for accommodation, while 10% of students faced difficulties in finding a place to live and resorted to paying guest accommodations for several months until they secured suitable accommodation.
Here are several significant questions we asked the students, along with the responses we received from the majority:.
Q1. Why did you opt not to choose a hostel for accommodation?.
Q2. What were the primary challenges you encountered during your room search?.
Q3. Can you provide insights into any issues you faced with roommates?.
Q4. Do you have a preference for paying guest accommodations (PGs)?.
Q5. In your opinion, is there a need for an online platform that assists students with accommodation?.
These questions helped us gather valuable information and insights directly from the students regarding their accommodation experiences. The results of the survey are shown in Fig 2.2 and.
4.

**Page 15**
2.3. Fig 2.2 illustrates the preferences that students consider when searching for rooms. These criteria are set by students to choose suitable accommodations.
1. Low rent (21%).
2. No brokerage fees (18%).
3. Rooms near universities (15%).
4. Rooms on lower floors (12%).
5. Ventilation status (12%).
6. Phone network status (7%).
7. Water supply status (5%).
8. Room Security (10%).
Students set the following criteria for choosing a suitable roommate shown in Fig.2.3.
1. Roommate from same course and same (37%).
2. Preferred senior roommate (24%).
3. Preferred junior roommate (18%).
4. Roommate from the same course (18%).
5. Roommate from the same state (3%).
[Bar chart graphic].
Problem 1: Students who spent 2-3 weeks in finding rooms. (approx 90%)
Problem 2: Students who pay brokerage. (approx 35%)
Problem 3: Students who don't get rooms at preferred location. (approx 30%)
Problem 4: Students who could not find roommates at the right time and hence end up paying extra rent. (approx 30%)
Problem 5: Students who could not find rooms and live in PGs for some months till they find a room. (approx 10%)
Problem 6: students(Mostly fresher) who couldn't get prefferable roommates. (approx 60%)
Fig. 2.1: The Fundamentals Problems Faced by Students.
5.

**Page 16**
Analysis about room preferences of students.
[Pie Chart displaying preferences: 12% Lower Floors, 15% Near University, 18% No brokerage, 21% Low Rent, 12% Ventilation status, 5% Phone Network status, 7% water supply status, 10% Room security].
Fig. 2.2: Analysis of room preferences of Students.
Fig. 2.2 illustrates the preferences that students consider when searching for rooms. These criteria are set by students to choose suitable accommodations.
Analysis about Roommate preferences.
[Pie chart displaying preferences: 18% Roommate from same state, 18% Roommate from same course, 24% Junior roommate, 37% Senior roommate, 3% Roommate from same course and same year].
Fig. 2.3: Analysis of Roommate Preferences of Students.
Fig. 2.3 depicts the analysis of the preferences given by students while searching for roommates.
6.

**Page 17**
Room demand Analysis.
[Line graph displaying the percentage of room demand by students over different months. Peaks in July, August, and September at roughly 80%.].
Fig. 2.4: Room demand of Students during different months.
Fig. 2.4 illustrates the fluctuating demand for rooms throughout different months. It is evident that the months of July, August, and September experience a significant peak in room requirements, reaching approximately 80%. Conversely, months such as April, May, June, and December exhibit minimal demand for rooms. Through our research and surveys, we identified key challenges faced by students when searching for rooms and roommates. They are as follows:.
1. Finding a suitable room typically takes around 15-30 days, resulting in significant expenditure of time and money.
2. Approximately 30%-40% of students are burdened with brokerage fees.
3. Many students struggle to secure accommodations in their preferred locations.
4. Students encounter challenges when searching for compatible roommates. Some resort to posting physical posters in localities and university campuses, while others utilize social media platforms. The following images showcase examples of these posters and Facebook posts.
[Screenshots of online social media posts and physical posters searching for roommates].
Fig. 2.5: Students use posters and social media to advertise available rooms and find potential roommates.
7.

**Page 18**
Fig. 2.5 demonstrates how students utilize posters and social media to advertise available rooms and find potential roommates.
2.2 Comparative Analysis of Existing Systems.
There are several websites and apps available,,, and that assist in finding rooms. However, most of these platforms are not specifically designed for the students of particular colleges. Additionally, many of them require payment for their services. These platforms operate across India, making it less likely for them to cater specifically to the needs of students. Furthermore, none of these platforms provide roommate facilities, as the concept of roommate matching is not incorporated into their functionalities.
Table 2.1 Comparative Analysis of Existing Systems.
No Broker: This website primarily specializes in the sale and purchase of residential flats. Its main areas of activity include Gurgaon, Mumbai, and Chennai. However, it does not currently offer specific accommodations for college students in close proximity to their respective colleges.
Rent Mantra: The website also emphasizes the buying and selling of properties, including information on rented places. However, it does not specifically cater to the needs of students. Additionally, it does not provide services such as roommate facilities for college students.
Magic Bricks: The website offers comprehensive information regarding flats located near college campuses. It caters to the general public rather than specifically targeting students. However, it does not provide roommate facilities.
Housing.com: This system is similar to other platforms as it caters to a general audience without a specific focus on any particular group such as students. Additionally, it requires payment for its services. Moreover, it does not provide any roommate facilities.
2.3 Objective and Purpose.
1. To provide the information of those providers who are nearest to their region.
2. To provide the information about the vacant room in JMI and JHU locality.
3. To help the fresher students who are not familiar with the said universities.
4. To provide a comprehensive and responsive service to tenants and students which delivers the student's satisfaction.
5. To contribute to the information of high quality, accessible, security, affordable, and sustainable rooms and to display it.
6. To provide an online platform that can be accessed from anywhere in the world.
7. To offer easy, simple, significant information to the students belonging anywhere in the world.
8. To provide information about the Nearby P.Gs for both boys and girls.
9. To provide the roommate facility who are JMI and JHU, students.
8.

**Page 19**
CHAPTER 3 TECHNOLOGY/PLATFORM OVERVIEW.
The acts of obtaining and analysing user needs, documenting requirements, prioritizing and organizing them, and checking and validating them are only a few of the phases involved in developing software requirements. All parties involved in the process, such as users, business analysts, software developers, and project managers, should be included.
Software development processes must take into account a variety of software needs. There are three types of requirements:.
1. Functional requirements specify what the software system must be able to perform, and they are often defined in terms of use cases or user stories. These requirements outline particular features and functionalities that the software system must offer its consumers. The ability to log in and register, save and retrieve data, and generate reports are a few examples of functional needs.
2. Non-functional requirements specify the behaviour of a software system and are frequently defined in terms of performance, reliability, security, and usability. These specifications list the qualities of the software system, including its availability, reaction speed, security features, and user friendliness. Response time, error management, and scalability are a few examples of non-functional requirements.
3. Technical specifications outline the hardware and software elements that must be used by the software system in order for it to work. Programming languages, operating systems, databases, and other technical specifications are frequently used to describe these needs. The programming languages used to create the software system, the operating system it runs on, and the database management system used to store data are a few examples of technical requirements.
3.1 Software requirements.
1. Operating System: Windows 10.
2. IDE: - Visual Code, Spider, Jupyter Notebook, Anaconda.
3. Browser: - Goggle Chrome.
4. Languages: - Python, JavaScript,.
5. Library: -NLTK , Tensor-flow, keras, numpy, matplotlib.
6. Frontend: - HTML5, CSS3, bootstarp5,Media query.
7. Backend: - Flask.
10.

**Page 20**
3.2 Hardware requirements.
1. Processor: Intel I7.
2. RAM :8GB.
3. ROM:50GB.
4. System Type: 64 -bit.
5. Monitor :15" Colour Monitor.
6. Mouse.
7. Keyboard.
3.3 Software configuration.
Front-end.
1. HTML5.
2. CSS3.
3. Bootstrap5.
4. Media Query.
Backend.
1. Flask.
Database.
1. MongoDB.
Machine Learning.
1. NLTK.
2. Tensor-Flow.
3.4 Software feature.
3.4.1 Python.
Python is a popular high-level programming language that is widely used for a variety of applications, including web development, data analysis, machine learning, and scientific computing. Here are some key features of Python:.
3.4.1.1 Features.
1. Easy-to-read and write syntax that emphasizes code readability and reduces the cost of program maintenance.
2. The extensive standard library that provides a wide range of modules and functions for common programming tasks, such as networking, file I/O, and regular expressions.
3. Dynamic and interpreted nature that allows for rapid development and prototyping.
4. Strong support for object-oriented, functional, and procedural programming paradigms.
11.

**Page 21**
5. Cross-platform compatibility that allows for running Python code on various operating systems, including Windows, Linux, and macOS.
6. Robust community of developers who contribute to the language, develop libraries and frameworks and provide support through forums and open-source projects.
3.4.1.2 Advantages.
1. Easy to learn and use, with a simple and intuitive syntax that reduces the learning curve for new developers.
2. The large and active community of developers and users who contribute to the language, develop libraries and frameworks, and provide support through forums and open-source projects.
3. An extensive standard library that provides a wide range of modules and functions for common programming tasks, reducing the need for additional third-party libraries.
4. Cross-platform compatibility allows for developing and running Python code on various operating systems, reducing the cost and complexity of development and deployment.
3.4.2 Flask.
Flask is a lightweight web framework written in Python that is designed to make it easy to create web applications quickly and efficiently.
3.4.2.1 Features.
1. Lightweight and minimalist, with a small core and a flexible architecture that makes it easy to extend and customize.
2. Built-in support for unit testing, debugging, and development server, making it easy to test and debug applications during development.
3. Modular and scalable, allowing developers to add and remove functionality as needed.
4. Support for a wide range of extensions and libraries that make it easy to add advanced functionality such as authentication, databases, and caching.
5. Built-in support for the Jinja2 templating engine, allowing for the creation of dynamic and responsive web pages and applications.
6. Easy integration with other web technologies such as HTML, CSS, and JavaScript.
3.4.2.2 Advantages.
1. Easy to learn and use, particularly for developers with a background in Python programming.
2. Flexible and customizable, allowing developers to create web applications that meet their specific needs and requirements.
3. Built-in support for testing, debugging, and development server, making it easy to develop and test applications during development.
12.

**Page 22**
1 level diagram.
[Data Flow Diagram showing Student and Owner interactions with Signup, Login, Verification, and Validation. Data passes to a Temporary DataBase and Permanent DataBase, managed by an Admin].
Fig. 4.8: 1st -Level DFD.
[Second Level DFD displaying interaction paths for JMI's STUDENT, JHU's STUDENT, and OWNER through Sign Up and Login, connecting into Verification and Validation. These processes interact with Temporary DB and Permanent DB. Admin oversees the flow, and users can access functions like Show All Type Rooms and Show All Roommate's Profile].
Fig. 4.9: 2nd Level DFD.
18.

**Page 23**
[ER Diagram mapping relationships between entities. JMI Student and JHU Student both have attributes: Name, state, Course, Contact, Photo, Admit card/Admission slip, Sex, and Email. Owner has attributes: Name, Rent, Email, Flat Address, Flat Description, Photo, Flat type, Floor. JMI Student and JHU Student use a 'Give details' relationship to 'Show'. Following an 'After Verification' process, it links to a Roommate entity with attributes: Name, State, Contact, Course, Vacancy, University JMI/JHU. Another 'Give details' process links Owner to Room type (1BHK, 2BHK, 3BHK)].
Fig. 4.10: ER –diagram.
19.

**Page 24**
CHAPTER 5 IMPLEMENTATION AND RESULT.
Our project is divided into two main modules: Owners and Tenants. The Tenants module is further subdivided into two categories: JHU Students and JMI Students. In order to ensure the security and privacy of our platform, we verify each student before granting them access to the private pages of our site. This verification process takes approximately two days to complete. Once verified, students are provided with login credentials to access the platform.
Our project is designed to be user-friendly and responsive, making it easy for students to find suitable accommodations and roommates. To store and retrieve information on the website, we have established a database connection. The platform is built using a variety of languages and frameworks, which will be discussed in more detail in this chapter.
5.1 Prerequisites for the code.
Download and install.
5.1.1 Sublime text.
Source: https://download.sublimetext.com/Sublime%20Text%20Build%203211%20x64%20Setup.exe.
5.1.2 Flask.
Run “pip install flask” in cmd or terminal of Visual Studio Code Terminal.
5.1.3 Bootstrap.
Source: https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.
5.1.4 JQuery.
Source: <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>.
5.1.5 MongoDB.
Source: https://downloads.mongodb.com/compass/mongodb-compass-1.36.4-win32-x64.exe.
5.2 Step for Run Application.
During the development of the Roomate4U platform, several key features and pages were implemented to address the accommodation and roommate needs of students at Jamia Millia Islamia University and Jamia Hamdard University. Below are some screenshots showcasing the results achieved in the project:.
20.

**Page 25**
[Image of a code editor running Python script containing app.py instructions and Flask endpoints such as `@app.route("/")`, `@app.route("/home")`, and `@app.route("/about", methods=["GET", "POST"])`.].
[Below the code is a terminal shell running the server on `http://127.0.0.1:5000/`, with messages showing successfully trained models like `training movies.yml`, `training politics.yml`, `training psychology.yml`, `training science.yml`, `training sports.yml`, and `training trivia.yml` hitting 100%.].