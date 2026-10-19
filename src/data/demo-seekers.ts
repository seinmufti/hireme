import type { Talent, User } from "@/lib/types"

// Generated demo job seekers (50 people across the Kurdistan Region, with varied backgrounds,
// some with no work experience yet). Built in, like the other demo accounts.

const CREATED = "2026-10-01T09:00:00.000Z"

export const DEMO_SEEKER_USERS: User[] = [
  {
    "id": "u-seeker-01",
    "name": "Aveen Salih",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#8A1538",
    "email": "aveen.salih@yahoo.com",
    "phone": "+964 751 436 4560",
    "city": "Kirkuk",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-02",
    "name": "Bushra Jabbar",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#4D7C0F",
    "email": "bushra.jabbar@gmail.com",
    "phone": "+964 771 558 4345",
    "city": "Ranya",
    "linkedin": "https://www.linkedin.com/in/bushra-jabbar",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-03",
    "name": "Mohammed Kakai",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#7C3AED",
    "email": "mohammed.kakai29@gmail.com",
    "phone": "+964 751 858 4529",
    "city": "Kirkuk",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-04",
    "name": "Havin Jabbar",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#B45309",
    "email": "havin.jabbar@gmail.com",
    "phone": "+964 751 469 5048",
    "city": "Soran",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-05",
    "name": "Sirwan Murad",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#8A1538",
    "email": "sirwan.murad@gmail.com",
    "phone": "+964 780 735 9983",
    "city": "Koya",
    "linkedin": "https://www.linkedin.com/in/sirwan-murad",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-06",
    "name": "Aso Karim",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#0E7490",
    "email": "aso.karim@gmail.com",
    "phone": "+964 750 222 4339",
    "city": "Duhok",
    "linkedin": "https://www.linkedin.com/in/aso-karim",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-07",
    "name": "Nian Ibrahim",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#B45309",
    "email": "nian.ibrahim27@yahoo.com",
    "phone": "+964 780 772 8120",
    "city": "Erbil",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-08",
    "name": "Twana Salih",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#047857",
    "email": "twana.salih@gmail.com",
    "phone": "+964 770 248 6794",
    "city": "Duhok",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-09",
    "name": "Aveen Hassan",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#0E7490",
    "email": "aveen.hassan@gmail.com",
    "phone": "+964 751 859 9392",
    "city": "Sulaymaniyah",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-10",
    "name": "Shaima Barzinji",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#4D7C0F",
    "email": "shaima.barzinji@gmail.com",
    "phone": "+964 751 591 4980",
    "city": "Erbil",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-11",
    "name": "Shwan Othman",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#8A1538",
    "email": "shwan.othman43@gmail.com",
    "phone": "+964 770 383 7417",
    "city": "Erbil",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-12",
    "name": "Karzan Hassan",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#047857",
    "email": "karzan.hassan@yahoo.com",
    "phone": "+964 770 461 8385",
    "city": "Ranya",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-13",
    "name": "Bushra Sadiq",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#7C3AED",
    "email": "bushra.sadiq@gmail.com",
    "phone": "+964 770 292 5842",
    "city": "Erbil",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-14",
    "name": "Ahmad Jabbar",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#1D4ED8",
    "email": "ahmad.jabbar@gmail.com",
    "phone": "+964 750 486 6124",
    "city": "Duhok",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-15",
    "name": "Shwan Qadir",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#B45309",
    "email": "shwan.qadir24@yahoo.com",
    "phone": "+964 771 307 6031",
    "city": "Erbil",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-16",
    "name": "Nawzad Barzinji",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#1D4ED8",
    "email": "nawzad.barzinji@gmail.com",
    "phone": "+964 750 895 3904",
    "city": "Halabja",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-17",
    "name": "Zhina Murad",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#BE185D",
    "email": "zhina.murad51@gmail.com",
    "phone": "+964 770 494 6183",
    "city": "Duhok",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-18",
    "name": "Ahmad Murad",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#BE185D",
    "email": "ahmad.murad@gmail.com",
    "phone": "+964 750 320 7185",
    "city": "Halabja",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-19",
    "name": "Dastan Salih",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#334155",
    "email": "dastan.salih@outlook.com",
    "phone": "+964 771 912 7874",
    "city": "Zakho",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-20",
    "name": "Nian Ahmed",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#B45309",
    "email": "nian.ahmed26@outlook.com",
    "phone": "+964 770 664 7025",
    "city": "Erbil",
    "linkedin": "https://www.linkedin.com/in/nian-ahmed",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-21",
    "name": "Kamaran Qadir",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#4D7C0F",
    "email": "kamaran.qadir@outlook.com",
    "phone": "+964 751 435 3505",
    "city": "Halabja",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-22",
    "name": "Zana Taha",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#B45309",
    "email": "zana.taha@gmail.com",
    "phone": "+964 770 560 3374",
    "city": "Kirkuk",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-23",
    "name": "Yad Khalid",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#1D4ED8",
    "email": "yad.khalid@yahoo.com",
    "phone": "+964 750 997 9892",
    "city": "Erbil",
    "linkedin": "https://www.linkedin.com/in/yad-khalid",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-24",
    "name": "Hiwa Rasul",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#047857",
    "email": "hiwa.rasul13@yahoo.com",
    "phone": "+964 751 325 2037",
    "city": "Ranya",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-25",
    "name": "Ahmad Faraj",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#BE185D",
    "email": "ahmad.faraj@gmail.com",
    "phone": "+964 750 285 6904",
    "city": "Kirkuk",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-26",
    "name": "Shaima Kakai",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#4D7C0F",
    "email": "shaima.kakai@yahoo.com",
    "phone": "+964 751 894 9938",
    "city": "Duhok",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-27",
    "name": "Yousif Younis",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#7C3AED",
    "email": "yousif.younis35@yahoo.com",
    "phone": "+964 751 387 8849",
    "city": "Sulaymaniyah",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-28",
    "name": "Payman Aziz",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#1D4ED8",
    "email": "payman.aziz@outlook.com",
    "phone": "+964 751 279 6646",
    "city": "Erbil",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-29",
    "name": "Dler Aziz",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#7C3AED",
    "email": "dler.aziz64@gmail.com",
    "phone": "+964 771 191 1986",
    "city": "Soran",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-30",
    "name": "Mohammed Saeed",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#BE185D",
    "email": "mohammed.saeed1@yahoo.com",
    "phone": "+964 751 957 8437",
    "city": "Sulaymaniyah",
    "linkedin": "https://www.linkedin.com/in/mohammed-saeed",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-31",
    "name": "Dler Ibrahim",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#8A1538",
    "email": "dler.ibrahim@yahoo.com",
    "phone": "+964 751 294 7979",
    "city": "Sulaymaniyah",
    "linkedin": "https://www.linkedin.com/in/dler-ibrahim",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-32",
    "name": "Zhina Zrar",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#1D4ED8",
    "email": "zhina.zrar@gmail.com",
    "phone": "+964 751 210 6227",
    "city": "Zakho",
    "linkedin": "https://www.linkedin.com/in/zhina-zrar",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-33",
    "name": "Nian Baban",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#7C3AED",
    "email": "nian.baban@gmail.com",
    "phone": "+964 780 677 7197",
    "city": "Koya",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-34",
    "name": "Hogir Baban",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#334155",
    "email": "hogir.baban13@gmail.com",
    "phone": "+964 771 777 6499",
    "city": "Erbil",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-35",
    "name": "Yousif Salih",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#BE185D",
    "email": "yousif.salih36@gmail.com",
    "phone": "+964 780 987 9271",
    "city": "Duhok",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-36",
    "name": "Nian Younis",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#0E7490",
    "email": "nian.younis@gmail.com",
    "phone": "+964 751 945 8289",
    "city": "Halabja",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-37",
    "name": "Sherko Ahmed",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#B45309",
    "email": "sherko.ahmed69@yahoo.com",
    "phone": "+964 780 723 4808",
    "city": "Koya",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-38",
    "name": "Dler Omar",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#0E7490",
    "email": "dler.omar@gmail.com",
    "phone": "+964 750 464 9576",
    "city": "Erbil",
    "linkedin": "https://www.linkedin.com/in/dler-omar",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-39",
    "name": "Shaima Baban",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#334155",
    "email": "shaima.baban27@gmail.com",
    "phone": "+964 751 295 6861",
    "city": "Erbil",
    "linkedin": "https://www.linkedin.com/in/shaima-baban",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-40",
    "name": "Nian Barzinji",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#334155",
    "email": "nian.barzinji30@yahoo.com",
    "phone": "+964 780 780 7018",
    "city": "Sulaymaniyah",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-41",
    "name": "Ahmad Omar",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#B45309",
    "email": "ahmad.omar@outlook.com",
    "phone": "+964 751 659 1789",
    "city": "Erbil",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-42",
    "name": "Twana Younis",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#0E7490",
    "email": "twana.younis@gmail.com",
    "phone": "+964 770 104 1748",
    "city": "Koya",
    "linkedin": "https://www.linkedin.com/in/twana-younis",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-43",
    "name": "Nawzad Othman",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#B45309",
    "email": "nawzad.othman31@gmail.com",
    "phone": "+964 750 649 6835",
    "city": "Erbil",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-44",
    "name": "Sirwan Mahmood",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#BE185D",
    "email": "sirwan.mahmood@gmail.com",
    "phone": "+964 751 226 2856",
    "city": "Erbil",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-45",
    "name": "Zana Ahmed",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#8A1538",
    "email": "zana.ahmed18@gmail.com",
    "phone": "+964 751 460 8991",
    "city": "Duhok",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-46",
    "name": "Ahmad Rasul",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#4D7C0F",
    "email": "ahmad.rasul45@yahoo.com",
    "phone": "+964 771 138 2138",
    "city": "Ranya",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-47",
    "name": "Nawzad Abdullah",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#7C3AED",
    "email": "nawzad.abdullah51@yahoo.com",
    "phone": "+964 751 926 7362",
    "city": "Halabja",
    "linkedin": "https://www.linkedin.com/in/nawzad-abdullah",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-48",
    "name": "Sherko Khalid",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#1D4ED8",
    "email": "sherko.khalid@outlook.com",
    "phone": "+964 751 393 7628",
    "city": "Zakho",
    "linkedin": "https://www.linkedin.com/in/sherko-khalid",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-49",
    "name": "Mizgin Abdullah",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#334155",
    "email": "mizgin.abdullah32@gmail.com",
    "phone": "+964 770 780 9528",
    "city": "Koya",
    "linkedin": "https://www.linkedin.com/in/mizgin-abdullah",
    "bio": "",
    "createdAt": CREATED
  },
  {
    "id": "u-seeker-50",
    "name": "Mizgin Taha",
    "role": "SEEKER",
    "title": "",
    "company": "",
    "avatarColor": "#334155",
    "email": "mizgin.taha@gmail.com",
    "phone": "+964 771 450 7799",
    "city": "Duhok",
    "linkedin": "",
    "bio": "",
    "createdAt": CREATED
  }
]

export const DEMO_SEEKER_TALENTS: Talent[] = [
  {
    "id": "t-seeker-01",
    "userId": "u-seeker-01",
    "gender": "Female",
    "dateOfBirth": "1981-11-20",
    "degrees": [
      {
        "id": "d-s01-1",
        "level": "Bachelor's",
        "name": "BA in Media and Communication",
        "field": "Media and Communication",
        "institution": "Koya University",
        "status": "Graduated",
        "startYear": "2000",
        "endYear": "2004"
      }
    ],
    "certifications": [
      {
        "id": "c-s01-1",
        "title": "TOEFL iBT",
        "institution": "ETS",
        "issued": "2021-07"
      },
      {
        "id": "c-s01-2",
        "title": "Google Digital Marketing",
        "institution": "Google",
        "issued": "2026-02"
      }
    ],
    "languages": [
      {
        "language": "Arabic",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Kurdish",
        "speaking": "B2",
        "reading": "B1"
      },
      {
        "language": "English",
        "speaking": "B2",
        "reading": "B2"
      }
    ],
    "experiences": [
      {
        "id": "x-s01-1",
        "title": "Brand Assistant",
        "employer": "Brusk Trading",
        "category": "Sales & Marketing",
        "contractType": "Full-time",
        "start": "2004-09",
        "end": "2006-04",
        "current": false
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-02",
    "userId": "u-seeker-02",
    "gender": "Female",
    "dateOfBirth": "2004-04-12",
    "degrees": [
      {
        "id": "d-s02-1",
        "level": "Bachelor's",
        "name": "BSc in Cybersecurity",
        "field": "Cybersecurity",
        "institution": "Koya University",
        "status": "Studying",
        "startYear": "2022",
        "endYear": "2026"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Arabic",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Kurdish",
        "speaking": "B1",
        "reading": "A2"
      },
      {
        "language": "English",
        "speaking": "B1",
        "reading": "B2"
      }
    ],
    "experiences": [
      {
        "id": "x-s02-1",
        "title": "Web Developer",
        "employer": "Peyman Technologies",
        "category": "Information Technology",
        "contractType": "Part-time",
        "start": "2023-10",
        "end": "2024-11",
        "current": false
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-03",
    "userId": "u-seeker-03",
    "gender": "Male",
    "dateOfBirth": "2001-10-01",
    "degrees": [
      {
        "id": "d-s03-1",
        "level": "Bachelor's",
        "name": "BA in Social Work",
        "field": "Social Work",
        "institution": "Duhok Polytechnic University",
        "status": "Graduated",
        "startYear": "2019",
        "endYear": "2023"
      }
    ],
    "certifications": [
      {
        "id": "c-s03-1",
        "title": "Advanced Excel",
        "institution": "Coursera",
        "issued": "2020-04"
      },
      {
        "id": "c-s03-2",
        "title": "TOEFL iBT",
        "institution": "ETS",
        "issued": "2021-03"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "B1",
        "reading": "C1"
      },
      {
        "language": "English",
        "speaking": "B2",
        "reading": "B2"
      }
    ],
    "experiences": [
      {
        "id": "x-s03-1",
        "title": "Community Mobilizer",
        "employer": "Bright Future Foundation",
        "category": "NGO & Humanitarian",
        "contractType": "Full-time",
        "start": "2025-09",
        "end": "",
        "current": true
      },
      {
        "id": "x-s03-2",
        "title": "Translator",
        "employer": "Hand in Hand Kurdistan",
        "category": "NGO & Humanitarian",
        "contractType": "Full-time",
        "start": "2023-09",
        "end": "2025-09",
        "current": false
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-04",
    "userId": "u-seeker-04",
    "gender": "Female",
    "dateOfBirth": "2004-08-03",
    "degrees": [
      {
        "id": "d-s04-1",
        "level": "Bachelor's",
        "name": "BSc in Chemistry",
        "field": "Chemistry",
        "institution": "Koya University",
        "status": "Studying",
        "startYear": "2023",
        "endYear": "2027"
      }
    ],
    "certifications": [
      {
        "id": "c-s04-1",
        "title": "TOEFL iBT",
        "institution": "ETS",
        "issued": "2024-08"
      },
      {
        "id": "c-s04-2",
        "title": "NEBOSH General Certificate",
        "institution": "NEBOSH",
        "issued": "2024-09"
      }
    ],
    "languages": [
      {
        "language": "Arabic",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Kurdish",
        "speaking": "B1",
        "reading": "A2"
      },
      {
        "language": "English",
        "speaking": "A2",
        "reading": "B1"
      }
    ],
    "experiences": [],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-05",
    "userId": "u-seeker-05",
    "gender": "Male",
    "dateOfBirth": "1980-01-05",
    "degrees": [
      {
        "id": "d-s05-1",
        "level": "Diploma",
        "name": "Diploma in Pharmacy",
        "field": "Pharmacy",
        "institution": "Hawler Medical University",
        "status": "Graduated",
        "startYear": "1999",
        "endYear": "2001"
      }
    ],
    "certifications": [
      {
        "id": "c-s05-1",
        "title": "IELTS Academic",
        "institution": "British Council",
        "issued": "2023-09"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "C2",
        "reading": "B1"
      },
      {
        "language": "English",
        "speaking": "C1",
        "reading": "C1"
      },
      {
        "language": "French",
        "speaking": "A2",
        "reading": "A1"
      }
    ],
    "experiences": [
      {
        "id": "x-s05-1",
        "title": "Pharmacist",
        "employer": "Duhok Health Clinic",
        "category": "Healthcare",
        "contractType": "Full-time",
        "start": "2007-11",
        "end": "",
        "current": true
      },
      {
        "id": "x-s05-2",
        "title": "Pharmacist",
        "employer": "Shar Clinic",
        "category": "Healthcare",
        "contractType": "Full-time",
        "start": "2004-07",
        "end": "2007-10",
        "current": false
      },
      {
        "id": "x-s05-3",
        "title": "Nurse",
        "employer": "Zheen Pharmacy",
        "category": "Healthcare",
        "contractType": "Full-time",
        "start": "2001-06",
        "end": "2004-05",
        "current": false
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-06",
    "userId": "u-seeker-06",
    "gender": "Male",
    "dateOfBirth": "2001-11-05",
    "degrees": [
      {
        "id": "d-s06-1",
        "level": "Bachelor's",
        "name": "BSc in Cybersecurity",
        "field": "Cybersecurity",
        "institution": "University of Duhok",
        "status": "Graduated",
        "startYear": "2020",
        "endYear": "2024"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "C2"
      },
      {
        "language": "Arabic",
        "speaking": "B1",
        "reading": "C2"
      },
      {
        "language": "English",
        "speaking": "B2",
        "reading": "B2"
      }
    ],
    "experiences": [],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-07",
    "userId": "u-seeker-07",
    "gender": "Female",
    "dateOfBirth": "1988-10-17",
    "degrees": [
      {
        "id": "d-s07-1",
        "level": "Bachelor's",
        "name": "BSc in Petroleum Engineering",
        "field": "Petroleum Engineering",
        "institution": "University of Sulaimani",
        "status": "Graduated",
        "startYear": "2007",
        "endYear": "2011"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "C1",
        "reading": "C1"
      },
      {
        "language": "English",
        "speaking": "C1",
        "reading": "C2"
      },
      {
        "language": "Persian",
        "speaking": "A2",
        "reading": "A2"
      }
    ],
    "experiences": [
      {
        "id": "x-s07-1",
        "title": "Production Technician",
        "employer": "Zagros Oilfield Services",
        "category": "Oil & Gas",
        "contractType": "Full-time",
        "start": "2014-11",
        "end": "",
        "current": true
      },
      {
        "id": "x-s07-2",
        "title": "Production Technician",
        "employer": "Kurdistan Energy Services",
        "category": "Oil & Gas",
        "contractType": "Full-time",
        "start": "2011-06",
        "end": "2014-09",
        "current": false
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-08",
    "userId": "u-seeker-08",
    "gender": "Male",
    "dateOfBirth": "1984-12-18",
    "degrees": [
      {
        "id": "d-s08-1",
        "level": "Bachelor's",
        "name": "BA in Marketing",
        "field": "Marketing",
        "institution": "Lebanese French University",
        "status": "Graduated",
        "startYear": "2003",
        "endYear": "2007"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "C1",
        "reading": "B2"
      }
    ],
    "experiences": [
      {
        "id": "x-s08-1",
        "title": "Support Specialist",
        "employer": "Rojhelat Services",
        "category": "Customer Service",
        "contractType": "Full-time",
        "start": "2009-09",
        "end": "",
        "current": true
      },
      {
        "id": "x-s08-2",
        "title": "Account Executive",
        "employer": "Brusk Trading",
        "category": "Sales & Marketing",
        "contractType": "Internship",
        "start": "2007-07",
        "end": "2009-09",
        "current": false
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-09",
    "userId": "u-seeker-09",
    "gender": "Female",
    "dateOfBirth": "1981-08-02",
    "degrees": [
      {
        "id": "d-s09-2",
        "level": "Master's",
        "name": "MSc in Dentistry",
        "field": "Dentistry",
        "institution": "Salahaddin University-Erbil",
        "status": "Graduated",
        "startYear": "2005",
        "endYear": "2007"
      },
      {
        "id": "d-s09-1",
        "level": "Bachelor's",
        "name": "BSc in Dentistry",
        "field": "Dentistry",
        "institution": "University of Sulaimani",
        "status": "Graduated",
        "startYear": "2000",
        "endYear": "2005"
      }
    ],
    "certifications": [
      {
        "id": "c-s09-1",
        "title": "First Aid and CPR",
        "institution": "Red Cross Training Center",
        "issued": "2025-12"
      }
    ],
    "languages": [
      {
        "language": "Arabic",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Kurdish",
        "speaking": "B2",
        "reading": "B1"
      },
      {
        "language": "English",
        "speaking": "B2",
        "reading": "C1"
      },
      {
        "language": "Turkish",
        "speaking": "B1",
        "reading": "A1"
      }
    ],
    "experiences": [
      {
        "id": "x-s09-1",
        "title": "Pharmacist",
        "employer": "Duhok Health Clinic",
        "category": "Healthcare",
        "contractType": "Full-time",
        "start": "2007-07",
        "end": "2010-11",
        "current": false
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-10",
    "userId": "u-seeker-10",
    "gender": "Female",
    "dateOfBirth": "1991-07-24",
    "degrees": [
      {
        "id": "d-s10-1",
        "level": "Bachelor's",
        "name": "BSc in Pharmacy",
        "field": "Pharmacy",
        "institution": "Hawler Medical University",
        "status": "Graduated",
        "startYear": "2009",
        "endYear": "2014"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "C1",
        "reading": "B2"
      }
    ],
    "experiences": [
      {
        "id": "x-s10-1",
        "title": "Nurse",
        "employer": "Hawler Medical Center",
        "category": "Healthcare",
        "contractType": "Internship",
        "start": "2014-10",
        "end": "",
        "current": true
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-11",
    "userId": "u-seeker-11",
    "gender": "Male",
    "dateOfBirth": "2006-01-25",
    "degrees": [
      {
        "id": "d-s11-1",
        "level": "Bachelor's",
        "name": "BA in Economics",
        "field": "Economics",
        "institution": "Erbil Polytechnic University",
        "status": "Studying",
        "startYear": "2024",
        "endYear": "2028"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "English",
        "speaking": "B1",
        "reading": "B1"
      }
    ],
    "experiences": [
      {
        "id": "x-s11-1",
        "title": "Bank Teller",
        "employer": "Hawler Accounting Office",
        "category": "Finance & Accounting",
        "contractType": "Part-time",
        "start": "2025-06",
        "end": "",
        "current": true
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-12",
    "userId": "u-seeker-12",
    "gender": "Male",
    "dateOfBirth": "1980-05-13",
    "degrees": [
      {
        "id": "d-s12-2",
        "level": "Master's",
        "name": "MSc in Architecture",
        "field": "Architecture",
        "institution": "Nawroz University",
        "status": "Graduated",
        "startYear": "2004",
        "endYear": "2006"
      },
      {
        "id": "d-s12-1",
        "level": "Bachelor's",
        "name": "BSc in Architecture",
        "field": "Architecture",
        "institution": "Nawroz University",
        "status": "Graduated",
        "startYear": "1998",
        "endYear": "2002"
      }
    ],
    "certifications": [
      {
        "id": "c-s12-1",
        "title": "IELTS Academic",
        "institution": "British Council",
        "issued": "2022-05"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "C2",
        "reading": "A2"
      }
    ],
    "experiences": [
      {
        "id": "x-s12-1",
        "title": "Quantity Surveyor",
        "employer": "Hawler Contracting",
        "category": "Construction",
        "contractType": "Full-time",
        "start": "2012-03",
        "end": "",
        "current": true
      },
      {
        "id": "x-s12-2",
        "title": "Civil Engineer",
        "employer": "Hawler Contracting",
        "category": "Construction",
        "contractType": "Full-time",
        "start": "2010-02",
        "end": "2012-02",
        "current": false
      },
      {
        "id": "x-s12-3",
        "title": "Site Supervisor",
        "employer": "Qaiwan Development",
        "category": "Construction",
        "contractType": "Internship",
        "start": "2006-10",
        "end": "2009-12",
        "current": false
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-13",
    "userId": "u-seeker-13",
    "gender": "Female",
    "dateOfBirth": "1996-09-20",
    "degrees": [
      {
        "id": "d-s13-1",
        "level": "Bachelor's",
        "name": "BSc in Petroleum Engineering",
        "field": "Petroleum Engineering",
        "institution": "Knowledge University",
        "status": "Graduated",
        "startYear": "2014",
        "endYear": "2018"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "English",
        "speaking": "C1",
        "reading": "C1"
      }
    ],
    "experiences": [],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-14",
    "userId": "u-seeker-14",
    "gender": "Male",
    "dateOfBirth": "1999-04-15",
    "degrees": [
      {
        "id": "d-s14-1",
        "level": "Bachelor's",
        "name": "BSc in Electrical Engineering",
        "field": "Electrical Engineering",
        "institution": "Duhok Polytechnic University",
        "status": "Graduated",
        "startYear": "2018",
        "endYear": "2022"
      }
    ],
    "certifications": [
      {
        "id": "c-s14-1",
        "title": "PMP",
        "institution": "Project Management Institute",
        "issued": "2026-07"
      },
      {
        "id": "c-s14-2",
        "title": "ICDL",
        "institution": "ICDL Foundation",
        "issued": "2022-08"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "C2"
      },
      {
        "language": "Arabic",
        "speaking": "B2",
        "reading": "C2"
      },
      {
        "language": "English",
        "speaking": "C1",
        "reading": "C2"
      }
    ],
    "experiences": [
      {
        "id": "x-s14-1",
        "title": "Project Assistant",
        "employer": "Lanaz Engineering",
        "category": "Engineering",
        "contractType": "Part-time",
        "start": "2022-08",
        "end": "",
        "current": true
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-15",
    "userId": "u-seeker-15",
    "gender": "Male",
    "dateOfBirth": "2006-10-04",
    "degrees": [
      {
        "id": "d-s15-1",
        "level": "Bachelor's",
        "name": "BSc in Architecture",
        "field": "Architecture",
        "institution": "Erbil Polytechnic University",
        "status": "Studying",
        "startYear": "2025",
        "endYear": "2029"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "B2",
        "reading": "A2"
      },
      {
        "language": "English",
        "speaking": "B2",
        "reading": "B2"
      }
    ],
    "experiences": [],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-16",
    "userId": "u-seeker-16",
    "gender": "Male",
    "dateOfBirth": "2006-02-22",
    "degrees": [
      {
        "id": "d-s16-1",
        "level": "Bachelor's",
        "name": "BA in Education",
        "field": "Education",
        "institution": "Nawroz University",
        "status": "Studying",
        "startYear": "2025",
        "endYear": "2029"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "C2"
      },
      {
        "language": "Arabic",
        "speaking": "B2",
        "reading": "B1"
      },
      {
        "language": "English",
        "speaking": "B1",
        "reading": "B2"
      },
      {
        "language": "Turkish",
        "speaking": "A2",
        "reading": "A1"
      }
    ],
    "experiences": [],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-17",
    "userId": "u-seeker-17",
    "gender": "Female",
    "dateOfBirth": "1997-04-06",
    "degrees": [
      {
        "id": "d-s17-1",
        "level": "Bachelor's",
        "name": "BSc in Psychology",
        "field": "Psychology",
        "institution": "Salahaddin University-Erbil",
        "status": "Graduated",
        "startYear": "2016",
        "endYear": "2020"
      }
    ],
    "certifications": [
      {
        "id": "c-s17-1",
        "title": "First Aid and CPR",
        "institution": "Red Cross Training Center",
        "issued": "2018-08"
      },
      {
        "id": "c-s17-2",
        "title": "Advanced Excel",
        "institution": "Coursera",
        "issued": "2019-02"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "C2",
        "reading": "C2"
      },
      {
        "language": "English",
        "speaking": "A2",
        "reading": "A2"
      }
    ],
    "experiences": [],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-18",
    "userId": "u-seeker-18",
    "gender": "Male",
    "dateOfBirth": "2006-02-06",
    "degrees": [
      {
        "id": "d-s18-1",
        "level": "Bachelor's",
        "name": "BSc in Agriculture",
        "field": "Agriculture",
        "institution": "Erbil Polytechnic University",
        "status": "Studying",
        "startYear": "2024",
        "endYear": "2028"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "B2",
        "reading": "B1"
      },
      {
        "language": "English",
        "speaking": "B2",
        "reading": "B2"
      },
      {
        "language": "German",
        "speaking": "A1",
        "reading": "A2"
      }
    ],
    "experiences": [],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-19",
    "userId": "u-seeker-19",
    "gender": "Female",
    "dateOfBirth": "2004-02-23",
    "degrees": [
      {
        "id": "d-s19-1",
        "level": "Bachelor's",
        "name": "BA in Media and Communication",
        "field": "Media and Communication",
        "institution": "Nawroz University",
        "status": "Studying",
        "startYear": "2022",
        "endYear": "2026"
      }
    ],
    "certifications": [
      {
        "id": "c-s19-1",
        "title": "Meta Social Media Marketing",
        "institution": "Meta",
        "issued": "2023-01"
      },
      {
        "id": "c-s19-2",
        "title": "ICDL",
        "institution": "ICDL Foundation",
        "issued": "2023-04"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "B1",
        "reading": "B2"
      },
      {
        "language": "English",
        "speaking": "C1",
        "reading": "C1"
      }
    ],
    "experiences": [],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-20",
    "userId": "u-seeker-20",
    "gender": "Female",
    "dateOfBirth": "1991-07-15",
    "degrees": [
      {
        "id": "d-s20-1",
        "level": "Bachelor's",
        "name": "BSc in Computer Science",
        "field": "Computer Science",
        "institution": "Soran University",
        "status": "Graduated",
        "startYear": "2009",
        "endYear": "2013"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "C2",
        "reading": "B2"
      },
      {
        "language": "English",
        "speaking": "A2",
        "reading": "A2"
      }
    ],
    "experiences": [],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-21",
    "userId": "u-seeker-21",
    "gender": "Male",
    "dateOfBirth": "2005-11-23",
    "degrees": [
      {
        "id": "d-s21-1",
        "level": "Bachelor's",
        "name": "BSc in Cybersecurity",
        "field": "Cybersecurity",
        "institution": "Knowledge University",
        "status": "Studying",
        "startYear": "2024",
        "endYear": "2028"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "C2"
      },
      {
        "language": "Arabic",
        "speaking": "C2",
        "reading": "B1"
      },
      {
        "language": "English",
        "speaking": "B2",
        "reading": "C1"
      }
    ],
    "experiences": [
      {
        "id": "x-s21-1",
        "title": "Junior Developer",
        "employer": "Sulav Digital",
        "category": "Information Technology",
        "contractType": "Internship",
        "start": "2025-07",
        "end": "",
        "current": true
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-22",
    "userId": "u-seeker-22",
    "gender": "Male",
    "dateOfBirth": "2002-01-27",
    "degrees": [
      {
        "id": "d-s22-1",
        "level": "Bachelor's",
        "name": "BSc in Architecture",
        "field": "Architecture",
        "institution": "Cihan University-Erbil",
        "status": "Graduated",
        "startYear": "2021",
        "endYear": "2025"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "C2"
      },
      {
        "language": "English",
        "speaking": "C1",
        "reading": "C1"
      }
    ],
    "experiences": [
      {
        "id": "x-s22-1",
        "title": "Architectural Draftsperson",
        "employer": "Sulaymaniyah Construction Co.",
        "category": "Construction",
        "contractType": "Full-time",
        "start": "2025-09",
        "end": "",
        "current": true
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-23",
    "userId": "u-seeker-23",
    "gender": "Male",
    "dateOfBirth": "2005-03-24",
    "degrees": [
      {
        "id": "d-s23-1",
        "level": "Bachelor's",
        "name": "BSc in Computer Science",
        "field": "Computer Science",
        "institution": "University of Kurdistan Hewler",
        "status": "Studying",
        "startYear": "2023",
        "endYear": "2027"
      }
    ],
    "certifications": [
      {
        "id": "c-s23-1",
        "title": "Microsoft Azure Fundamentals",
        "institution": "Microsoft",
        "issued": "2024-06"
      },
      {
        "id": "c-s23-2",
        "title": "Project Management Basics",
        "institution": "Coursera",
        "issued": "2026-05"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "B1",
        "reading": "C2"
      },
      {
        "language": "English",
        "speaking": "C1",
        "reading": "C2"
      }
    ],
    "experiences": [
      {
        "id": "x-s23-1",
        "title": "Network Administrator",
        "employer": "Kurdistan Cloud Services",
        "category": "Information Technology",
        "contractType": "Internship",
        "start": "2024-08",
        "end": "",
        "current": true
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-24",
    "userId": "u-seeker-24",
    "gender": "Female",
    "dateOfBirth": "1993-03-13",
    "degrees": [
      {
        "id": "d-s24-1",
        "level": "Bachelor's",
        "name": "BSc in Mechanical Engineering",
        "field": "Mechanical Engineering",
        "institution": "University of Kurdistan Hewler",
        "status": "Graduated",
        "startYear": "2011",
        "endYear": "2015"
      }
    ],
    "certifications": [
      {
        "id": "c-s24-1",
        "title": "AutoCAD Professional",
        "institution": "Autodesk",
        "issued": "2020-01"
      },
      {
        "id": "c-s24-2",
        "title": "PMP",
        "institution": "Project Management Institute",
        "issued": "2025-09"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "B2",
        "reading": "C1"
      },
      {
        "language": "English",
        "speaking": "B1",
        "reading": "B1"
      }
    ],
    "experiences": [
      {
        "id": "x-s24-1",
        "title": "Site Engineer",
        "employer": "Erbil Consulting Engineers",
        "category": "Engineering",
        "contractType": "Full-time",
        "start": "2015-09",
        "end": "2018-09",
        "current": false
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-25",
    "userId": "u-seeker-25",
    "gender": "Male",
    "dateOfBirth": "1988-11-25",
    "degrees": [
      {
        "id": "d-s25-1",
        "level": "Bachelor's",
        "name": "BA in Management",
        "field": "Management",
        "institution": "Tishk International University",
        "status": "Graduated",
        "startYear": "2006",
        "endYear": "2010"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Arabic",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Kurdish",
        "speaking": "A2",
        "reading": "A1"
      },
      {
        "language": "English",
        "speaking": "C1",
        "reading": "C1"
      }
    ],
    "experiences": [
      {
        "id": "x-s25-1",
        "title": "Secretary",
        "employer": "Erbil Trading Company",
        "category": "Administration",
        "contractType": "Full-time",
        "start": "2010-07",
        "end": "2011-07",
        "current": false
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-26",
    "userId": "u-seeker-26",
    "gender": "Female",
    "dateOfBirth": "2006-04-22",
    "degrees": [
      {
        "id": "d-s26-1",
        "level": "Bachelor's",
        "name": "BA in Translation",
        "field": "Translation",
        "institution": "Koya University",
        "status": "Studying",
        "startYear": "2025",
        "endYear": "2029"
      }
    ],
    "certifications": [
      {
        "id": "c-s26-1",
        "title": "ICDL",
        "institution": "ICDL Foundation",
        "issued": "2025-07"
      },
      {
        "id": "c-s26-2",
        "title": "TOEFL iBT",
        "institution": "ETS",
        "issued": "2025-07"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "C2"
      },
      {
        "language": "English",
        "speaking": "B2",
        "reading": "B2"
      }
    ],
    "experiences": [],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-27",
    "userId": "u-seeker-27",
    "gender": "Male",
    "dateOfBirth": "2006-11-16",
    "degrees": [
      {
        "id": "d-s27-1",
        "level": "Bachelor's",
        "name": "BSc in Dentistry",
        "field": "Dentistry",
        "institution": "Sulaimani Polytechnic University",
        "status": "Studying",
        "startYear": "2024",
        "endYear": "2029"
      }
    ],
    "certifications": [
      {
        "id": "c-s27-1",
        "title": "First Aid and CPR",
        "institution": "Red Cross Training Center",
        "issued": "2026-09"
      }
    ],
    "languages": [
      {
        "language": "Arabic",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Kurdish",
        "speaking": "B2",
        "reading": "A2"
      },
      {
        "language": "English",
        "speaking": "C1",
        "reading": "C1"
      }
    ],
    "experiences": [],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-28",
    "userId": "u-seeker-28",
    "gender": "Female",
    "dateOfBirth": "2007-05-27",
    "degrees": [
      {
        "id": "d-s28-1",
        "level": "Bachelor's",
        "name": "BSc in Civil Engineering",
        "field": "Civil Engineering",
        "institution": "Charmo University",
        "status": "Studying",
        "startYear": "2026",
        "endYear": "2030"
      }
    ],
    "certifications": [
      {
        "id": "c-s28-1",
        "title": "TOEFL iBT",
        "institution": "ETS",
        "issued": "2026-01"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "English",
        "speaking": "B1",
        "reading": "B1"
      }
    ],
    "experiences": [],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-29",
    "userId": "u-seeker-29",
    "gender": "Male",
    "dateOfBirth": "2001-01-02",
    "degrees": [
      {
        "id": "d-s29-1",
        "level": "Bachelor's",
        "name": "BSc in Architecture",
        "field": "Architecture",
        "institution": "Charmo University",
        "status": "Graduated",
        "startYear": "2020",
        "endYear": "2024"
      }
    ],
    "certifications": [
      {
        "id": "c-s29-1",
        "title": "NEBOSH General Certificate",
        "institution": "NEBOSH",
        "issued": "2023-01"
      },
      {
        "id": "c-s29-2",
        "title": "Advanced Excel",
        "institution": "Coursera",
        "issued": "2026-04"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "C1",
        "reading": "B2"
      },
      {
        "language": "English",
        "speaking": "B1",
        "reading": "B1"
      }
    ],
    "experiences": [
      {
        "id": "x-s29-1",
        "title": "Quantity Surveyor",
        "employer": "Hawler Contracting",
        "category": "Construction",
        "contractType": "Part-time",
        "start": "2024-09",
        "end": "",
        "current": true
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-30",
    "userId": "u-seeker-30",
    "gender": "Male",
    "dateOfBirth": "1988-11-13",
    "degrees": [
      {
        "id": "d-s30-2",
        "level": "Master's",
        "name": "MSc in Political Science",
        "field": "Political Science",
        "institution": "Charmo University",
        "status": "Graduated",
        "startYear": "2013",
        "endYear": "2015"
      },
      {
        "id": "d-s30-1",
        "level": "Bachelor's",
        "name": "BA in Political Science",
        "field": "Political Science",
        "institution": "Charmo University",
        "status": "Graduated",
        "startYear": "2007",
        "endYear": "2011"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "C2"
      },
      {
        "language": "Arabic",
        "speaking": "B1",
        "reading": "C1"
      },
      {
        "language": "English",
        "speaking": "B2",
        "reading": "B2"
      }
    ],
    "experiences": [
      {
        "id": "x-s30-1",
        "title": "Case Worker",
        "employer": "Kurdistan Relief Network",
        "category": "NGO & Humanitarian",
        "contractType": "Full-time",
        "start": "2017-01",
        "end": "2020-06",
        "current": false
      },
      {
        "id": "x-s30-2",
        "title": "Program Assistant",
        "employer": "Bright Future Foundation",
        "category": "NGO & Humanitarian",
        "contractType": "Full-time",
        "start": "2015-09",
        "end": "2016-11",
        "current": false
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-31",
    "userId": "u-seeker-31",
    "gender": "Male",
    "dateOfBirth": "1989-09-12",
    "degrees": [
      {
        "id": "d-s31-2",
        "level": "Master's",
        "name": "MSc in Media and Communication",
        "field": "Media and Communication",
        "institution": "Koya University",
        "status": "Graduated",
        "startYear": "2012",
        "endYear": "2014"
      },
      {
        "id": "d-s31-1",
        "level": "Bachelor's",
        "name": "BA in Media and Communication",
        "field": "Media and Communication",
        "institution": "Koya University",
        "status": "Graduated",
        "startYear": "2007",
        "endYear": "2011"
      }
    ],
    "certifications": [
      {
        "id": "c-s31-1",
        "title": "Meta Social Media Marketing",
        "institution": "Meta",
        "issued": "2023-11"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      }
    ],
    "experiences": [],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-32",
    "userId": "u-seeker-32",
    "gender": "Female",
    "dateOfBirth": "2003-05-15",
    "degrees": [
      {
        "id": "d-s32-1",
        "level": "Diploma",
        "name": "Diploma in Banking",
        "field": "Banking",
        "institution": "Salahaddin University-Erbil",
        "status": "Graduated",
        "startYear": "2022",
        "endYear": "2024"
      }
    ],
    "certifications": [
      {
        "id": "c-s32-1",
        "title": "Advanced Excel",
        "institution": "Coursera",
        "issued": "2025-03"
      },
      {
        "id": "c-s32-2",
        "title": "Advanced Excel",
        "institution": "Coursera",
        "issued": "2023-08"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "B1",
        "reading": "C1"
      },
      {
        "language": "English",
        "speaking": "C1",
        "reading": "C1"
      }
    ],
    "experiences": [
      {
        "id": "x-s32-1",
        "title": "Finance Assistant",
        "employer": "Rawand Finance",
        "category": "Finance & Accounting",
        "contractType": "Internship",
        "start": "2024-09",
        "end": "",
        "current": true
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-33",
    "userId": "u-seeker-33",
    "gender": "Female",
    "dateOfBirth": "2001-11-28",
    "degrees": [
      {
        "id": "d-s33-1",
        "level": "Diploma",
        "name": "Diploma in Medical Laboratory Technology",
        "field": "Medical Laboratory Technology",
        "institution": "University of Duhok",
        "status": "Graduated",
        "startYear": "2020",
        "endYear": "2022"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Arabic",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Kurdish",
        "speaking": "B1",
        "reading": "A1"
      },
      {
        "language": "English",
        "speaking": "A2",
        "reading": "A2"
      }
    ],
    "experiences": [
      {
        "id": "x-s33-1",
        "title": "Pharmacist",
        "employer": "Hawler Medical Center",
        "category": "Healthcare",
        "contractType": "Full-time",
        "start": "2024-12",
        "end": "",
        "current": true
      },
      {
        "id": "x-s33-2",
        "title": "Clinic Assistant",
        "employer": "Shar Clinic",
        "category": "Healthcare",
        "contractType": "Full-time",
        "start": "2022-10",
        "end": "2024-11",
        "current": false
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-34",
    "userId": "u-seeker-34",
    "gender": "Male",
    "dateOfBirth": "2001-10-08",
    "degrees": [
      {
        "id": "d-s34-1",
        "level": "Bachelor's",
        "name": "BSc in Civil Engineering",
        "field": "Civil Engineering",
        "institution": "Sulaimani Polytechnic University",
        "status": "Graduated",
        "startYear": "2020",
        "endYear": "2024"
      }
    ],
    "certifications": [
      {
        "id": "c-s34-1",
        "title": "TOEFL iBT",
        "institution": "ETS",
        "issued": "2021-02"
      },
      {
        "id": "c-s34-2",
        "title": "Advanced Excel",
        "institution": "Coursera",
        "issued": "2024-06"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "C1",
        "reading": "A2"
      }
    ],
    "experiences": [
      {
        "id": "x-s34-1",
        "title": "Quantity Surveyor",
        "employer": "Sulaymaniyah Construction Co.",
        "category": "Construction",
        "contractType": "Full-time",
        "start": "2024-10",
        "end": "2026-05",
        "current": false
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-35",
    "userId": "u-seeker-35",
    "gender": "Male",
    "dateOfBirth": "2005-03-12",
    "degrees": [
      {
        "id": "d-s35-1",
        "level": "Bachelor's",
        "name": "BA in Business Administration",
        "field": "Business Administration",
        "institution": "Duhok Polytechnic University",
        "status": "Studying",
        "startYear": "2024",
        "endYear": "2028"
      }
    ],
    "certifications": [
      {
        "id": "c-s35-1",
        "title": "Google Digital Marketing",
        "institution": "Google",
        "issued": "2026-09"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "C1",
        "reading": "C1"
      },
      {
        "language": "English",
        "speaking": "A2",
        "reading": "B1"
      }
    ],
    "experiences": [
      {
        "id": "x-s35-1",
        "title": "Sales Representative",
        "employer": "Brusk Trading",
        "category": "Sales & Marketing",
        "contractType": "Internship",
        "start": "2025-06",
        "end": "",
        "current": true
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-36",
    "userId": "u-seeker-36",
    "gender": "Female",
    "dateOfBirth": "1999-10-11",
    "degrees": [
      {
        "id": "d-s36-1",
        "level": "Bachelor's",
        "name": "BA in Marketing",
        "field": "Marketing",
        "institution": "Cihan University-Erbil",
        "status": "Graduated",
        "startYear": "2017",
        "endYear": "2021"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "B1",
        "reading": "C1"
      },
      {
        "language": "English",
        "speaking": "C1",
        "reading": "C1"
      }
    ],
    "experiences": [],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-37",
    "userId": "u-seeker-37",
    "gender": "Male",
    "dateOfBirth": "1993-10-04",
    "degrees": [
      {
        "id": "d-s37-2",
        "level": "Master's",
        "name": "MA in Business Administration",
        "field": "Business Administration",
        "institution": "Charmo University",
        "status": "Graduated",
        "startYear": "2016",
        "endYear": "2018"
      },
      {
        "id": "d-s37-1",
        "level": "Bachelor's",
        "name": "BA in Business Administration",
        "field": "Business Administration",
        "institution": "Erbil Polytechnic University",
        "status": "Graduated",
        "startYear": "2011",
        "endYear": "2015"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "B2",
        "reading": "C2"
      },
      {
        "language": "English",
        "speaking": "C1",
        "reading": "C2"
      }
    ],
    "experiences": [
      {
        "id": "x-s37-1",
        "title": "Sales Representative",
        "employer": "Nawroz Advertising",
        "category": "Sales & Marketing",
        "contractType": "Full-time",
        "start": "2021-06",
        "end": "",
        "current": true
      },
      {
        "id": "x-s37-2",
        "title": "Brand Assistant",
        "employer": "Kurdistan Retail Group",
        "category": "Sales & Marketing",
        "contractType": "Full-time",
        "start": "2018-09",
        "end": "2021-03",
        "current": false
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-38",
    "userId": "u-seeker-38",
    "gender": "Male",
    "dateOfBirth": "2006-06-27",
    "degrees": [
      {
        "id": "d-s38-1",
        "level": "Bachelor's",
        "name": "BA in English Language",
        "field": "English Language",
        "institution": "Komar University of Science and Technology",
        "status": "Studying",
        "startYear": "2025",
        "endYear": "2029"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "B2",
        "reading": "B2"
      },
      {
        "language": "English",
        "speaking": "B1",
        "reading": "B1"
      }
    ],
    "experiences": [],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-39",
    "userId": "u-seeker-39",
    "gender": "Female",
    "dateOfBirth": "2007-11-08",
    "degrees": [
      {
        "id": "d-s39-1",
        "level": "Bachelor's",
        "name": "BSc in Chemistry",
        "field": "Chemistry",
        "institution": "University of Sulaimani",
        "status": "Studying",
        "startYear": "2026",
        "endYear": "2030"
      }
    ],
    "certifications": [
      {
        "id": "c-s39-1",
        "title": "TOEFL iBT",
        "institution": "ETS",
        "issued": "2025-11"
      },
      {
        "id": "c-s39-2",
        "title": "HSE Level 2",
        "institution": "Kurdistan Safety Institute",
        "issued": "2025-04"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "English",
        "speaking": "A2",
        "reading": "A2"
      }
    ],
    "experiences": [],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-40",
    "userId": "u-seeker-40",
    "gender": "Female",
    "dateOfBirth": "2005-01-20",
    "degrees": [
      {
        "id": "d-s40-1",
        "level": "Bachelor's",
        "name": "BSc in Chemistry",
        "field": "Chemistry",
        "institution": "Koya University",
        "status": "Studying",
        "startYear": "2023",
        "endYear": "2027"
      }
    ],
    "certifications": [
      {
        "id": "c-s40-1",
        "title": "Advanced Excel",
        "institution": "Coursera",
        "issued": "2025-01"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "C1",
        "reading": "B2"
      },
      {
        "language": "English",
        "speaking": "C1",
        "reading": "C1"
      }
    ],
    "experiences": [
      {
        "id": "x-s40-1",
        "title": "Production Technician",
        "employer": "Kurdistan Energy Services",
        "category": "Oil & Gas",
        "contractType": "Part-time",
        "start": "2024-07",
        "end": "",
        "current": true
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-41",
    "userId": "u-seeker-41",
    "gender": "Male",
    "dateOfBirth": "1998-09-26",
    "degrees": [
      {
        "id": "d-s41-2",
        "level": "Master's",
        "name": "MSc in Mechanical Engineering",
        "field": "Mechanical Engineering",
        "institution": "Nawroz University",
        "status": "Graduated",
        "startYear": "2021",
        "endYear": "2023"
      },
      {
        "id": "d-s41-1",
        "level": "Bachelor's",
        "name": "BSc in Mechanical Engineering",
        "field": "Mechanical Engineering",
        "institution": "University of Kurdistan Hewler",
        "status": "Graduated",
        "startYear": "2017",
        "endYear": "2021"
      }
    ],
    "certifications": [
      {
        "id": "c-s41-1",
        "title": "TOEFL iBT",
        "institution": "ETS",
        "issued": "2019-06"
      },
      {
        "id": "c-s41-2",
        "title": "ICDL",
        "institution": "ICDL Foundation",
        "issued": "2024-03"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "C2",
        "reading": "B1"
      },
      {
        "language": "English",
        "speaking": "B1",
        "reading": "B2"
      }
    ],
    "experiences": [],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-42",
    "userId": "u-seeker-42",
    "gender": "Male",
    "dateOfBirth": "1995-05-21",
    "degrees": [
      {
        "id": "d-s42-1",
        "level": "Bachelor's",
        "name": "BSc in Computer Science",
        "field": "Computer Science",
        "institution": "Salahaddin University-Erbil",
        "status": "Graduated",
        "startYear": "2014",
        "endYear": "2018"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "C2",
        "reading": "C1"
      },
      {
        "language": "English",
        "speaking": "A2",
        "reading": "A2"
      }
    ],
    "experiences": [],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-43",
    "userId": "u-seeker-43",
    "gender": "Male",
    "dateOfBirth": "2000-08-11",
    "degrees": [
      {
        "id": "d-s43-2",
        "level": "Master's",
        "name": "MSc in Electrical Engineering",
        "field": "Electrical Engineering",
        "institution": "Charmo University",
        "status": "Graduated",
        "startYear": "2022",
        "endYear": "2024"
      },
      {
        "id": "d-s43-1",
        "level": "Bachelor's",
        "name": "BSc in Electrical Engineering",
        "field": "Electrical Engineering",
        "institution": "Charmo University",
        "status": "Graduated",
        "startYear": "2018",
        "endYear": "2022"
      }
    ],
    "certifications": [
      {
        "id": "c-s43-1",
        "title": "Advanced Excel",
        "institution": "Coursera",
        "issued": "2021-03"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "B2",
        "reading": "B2"
      },
      {
        "language": "English",
        "speaking": "C1",
        "reading": "C2"
      }
    ],
    "experiences": [
      {
        "id": "x-s43-1",
        "title": "Project Assistant",
        "employer": "Erbil Consulting Engineers",
        "category": "Engineering",
        "contractType": "Full-time",
        "start": "2024-07",
        "end": "",
        "current": true
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-44",
    "userId": "u-seeker-44",
    "gender": "Male",
    "dateOfBirth": "2000-06-18",
    "degrees": [
      {
        "id": "d-s44-1",
        "level": "Bachelor's",
        "name": "BSc in Civil Engineering",
        "field": "Civil Engineering",
        "institution": "Cihan University-Erbil",
        "status": "Graduated",
        "startYear": "2019",
        "endYear": "2023"
      }
    ],
    "certifications": [
      {
        "id": "c-s44-1",
        "title": "ICDL",
        "institution": "ICDL Foundation",
        "issued": "2025-03"
      }
    ],
    "languages": [
      {
        "language": "Arabic",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Kurdish",
        "speaking": "B2",
        "reading": "B1"
      },
      {
        "language": "English",
        "speaking": "B1",
        "reading": "B2"
      },
      {
        "language": "Turkish",
        "speaking": "A2",
        "reading": "A2"
      }
    ],
    "experiences": [
      {
        "id": "x-s44-1",
        "title": "Quantity Surveyor",
        "employer": "Qaiwan Development",
        "category": "Construction",
        "contractType": "Full-time",
        "start": "2023-08",
        "end": "",
        "current": true
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-45",
    "userId": "u-seeker-45",
    "gender": "Male",
    "dateOfBirth": "1990-02-18",
    "degrees": [
      {
        "id": "d-s45-1",
        "level": "Bachelor's",
        "name": "BA in Translation",
        "field": "Translation",
        "institution": "Tishk International University",
        "status": "Graduated",
        "startYear": "2009",
        "endYear": "2013"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "B2",
        "reading": "A2"
      }
    ],
    "experiences": [
      {
        "id": "x-s45-1",
        "title": "Field Officer",
        "employer": "Hand in Hand Kurdistan",
        "category": "NGO & Humanitarian",
        "contractType": "Full-time",
        "start": "2013-06",
        "end": "2016-04",
        "current": false
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-46",
    "userId": "u-seeker-46",
    "gender": "Male",
    "dateOfBirth": "1995-01-06",
    "degrees": [
      {
        "id": "d-s46-1",
        "level": "Bachelor's",
        "name": "BSc in Banking",
        "field": "Banking",
        "institution": "University of Zakho",
        "status": "Graduated",
        "startYear": "2013",
        "endYear": "2017"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "English",
        "speaking": "B1",
        "reading": "B1"
      }
    ],
    "experiences": [
      {
        "id": "x-s46-1",
        "title": "Customer Service Agent",
        "employer": "Erbil Call Center",
        "category": "Customer Service",
        "contractType": "Full-time",
        "start": "2022-02",
        "end": "",
        "current": true
      },
      {
        "id": "x-s46-2",
        "title": "Finance Assistant",
        "employer": "Sulaymaniyah Trade Bank",
        "category": "Finance & Accounting",
        "contractType": "Full-time",
        "start": "2018-07",
        "end": "2021-11",
        "current": false
      },
      {
        "id": "x-s46-3",
        "title": "Junior Auditor",
        "employer": "Hawler Accounting Office",
        "category": "Finance & Accounting",
        "contractType": "Part-time",
        "start": "2017-09",
        "end": "2018-05",
        "current": false
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-47",
    "userId": "u-seeker-47",
    "gender": "Male",
    "dateOfBirth": "2006-05-06",
    "degrees": [
      {
        "id": "d-s47-1",
        "level": "Diploma",
        "name": "Diploma in Business Administration",
        "field": "Business Administration",
        "institution": "Cihan University-Erbil",
        "status": "Graduated",
        "startYear": "2024",
        "endYear": "2026"
      }
    ],
    "certifications": [
      {
        "id": "c-s47-1",
        "title": "IELTS Academic",
        "institution": "British Council",
        "issued": "2025-09"
      },
      {
        "id": "c-s47-2",
        "title": "TOEFL iBT",
        "institution": "ETS",
        "issued": "2026-07"
      }
    ],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "English",
        "speaking": "A2",
        "reading": "B1"
      }
    ],
    "experiences": [],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-48",
    "userId": "u-seeker-48",
    "gender": "Male",
    "dateOfBirth": "2004-08-18",
    "degrees": [
      {
        "id": "d-s48-1",
        "level": "Diploma",
        "name": "Diploma in Cybersecurity",
        "field": "Cybersecurity",
        "institution": "Knowledge University",
        "status": "Graduated",
        "startYear": "2023",
        "endYear": "2025"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "B2",
        "reading": "A2"
      },
      {
        "language": "English",
        "speaking": "C1",
        "reading": "C1"
      }
    ],
    "experiences": [
      {
        "id": "x-s48-1",
        "title": "Web Developer",
        "employer": "Duhok IT Solutions",
        "category": "Information Technology",
        "contractType": "Full-time",
        "start": "2025-10",
        "end": "",
        "current": true
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-49",
    "userId": "u-seeker-49",
    "gender": "Female",
    "dateOfBirth": "2003-06-28",
    "degrees": [
      {
        "id": "d-s49-1",
        "level": "Bachelor's",
        "name": "BSc in Petroleum Engineering",
        "field": "Petroleum Engineering",
        "institution": "Charmo University",
        "status": "Graduated",
        "startYear": "2021",
        "endYear": "2025"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "C2",
        "reading": "C1"
      },
      {
        "language": "English",
        "speaking": "C1",
        "reading": "C2"
      }
    ],
    "experiences": [
      {
        "id": "x-s49-1",
        "title": "Drilling Assistant",
        "employer": "Kurdistan Energy Services",
        "category": "Oil & Gas",
        "contractType": "Full-time",
        "start": "2025-08",
        "end": "",
        "current": true
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  },
  {
    "id": "t-seeker-50",
    "userId": "u-seeker-50",
    "gender": "Female",
    "dateOfBirth": "1986-10-13",
    "degrees": [
      {
        "id": "d-s50-1",
        "level": "Diploma",
        "name": "Diploma in Agriculture",
        "field": "Agriculture",
        "institution": "Nawroz University",
        "status": "Graduated",
        "startYear": "2005",
        "endYear": "2007"
      }
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Kurdish",
        "speaking": "Native",
        "reading": "Native"
      },
      {
        "language": "Arabic",
        "speaking": "B1",
        "reading": "C2"
      },
      {
        "language": "English",
        "speaking": "B2",
        "reading": "B2"
      }
    ],
    "experiences": [
      {
        "id": "x-s50-1",
        "title": "Warehouse Supervisor",
        "employer": "Hawler Supply Services",
        "category": "Logistics & Supply Chain",
        "contractType": "Internship",
        "start": "2007-09",
        "end": "",
        "current": true
      }
    ],
    "published": true,
    "createdAt": CREATED,
    "updatedAt": CREATED
  }
]
