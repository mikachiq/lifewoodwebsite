const fs = require("fs");

const path = "constants.ts";
let src = fs.readFileSync(path, "utf8");

const localeOrder = [
  "zhBase",
  "msBase",
  "tlBase",
  "bnBase",
  "hiBase",
  "esBase",
  "jaBase",
  "koBase",
];

const fixes = {
  zhBase: {
    footerOurTeam: "我们的团队",
    footerCareers: "职业机会",
    footerNews: "新闻",
    footerCookie: "Cookie 政策",
    footerTerms: "条款与条件",
    benefit1: "全球机会",
    benefit2: "前沿 AI",
    benefit3: "有竞争力的薪酬",
    benefit4: "职业成长",
    benefit5: "包容文化",
    benefit6: "有意义的影响",
    formSectionPersonal: "个人信息",
    formSectionPosition: "职位与经验",
    formFirstName: "名字",
    formFirstNamePlaceholder: "例如：太郎",
    formLastName: "姓氏",
    formLastNamePlaceholder: "例如：山田",
    formEmail: "电子邮箱",
    formEmailPlaceholder: "john.doe@example.com",
    formPhone: "电话号码",
    formPhonePlaceholder: "012 345 6789",
    formPositionLabel: "应聘职位",
    formPositionPlaceholder: "选择职位",
    formPosAnnotator: "数据标注专员",
    formPosAnalyst: "数据分析师",
    formPosTrainer: "AI 训练师",
    formPosManager: "项目经理",
    formPosIntern: "实习生",
    formExpLabel: "经验级别",
    formExpPlaceholder: "选择经验级别",
    formExpEntry: "入门级（0-2年）",
    formExpMid: "中级（3-5年）",
    formExpSenior: "高级（6年以上）",
    formWorkLocationLabel: "首选办公地点",
    formWorkLocationPlaceholder: "选择首选地点",
    formNeedHelp: "需要帮助？",
    formResumeLabel: "简历",
    formResumePlaceholder: "点击或拖拽上传简历",
    formResumeSub: "PDF、DOC、DOCX（最大 5MB）",
    formBtnCancel: "取消",
    formRequired: "必填",
    pContFormName: "姓名",
    pContFormNamePlaceholder: "请输入您的姓名",
    pContFormEmail: "工作邮箱",
    pContFormEmailPlaceholder: "email@company.com",
    pContFormOrg: "机构/公司",
    pContFormOrgPlaceholder: "公司名称",
    pContFormMsg: "请告诉我们您的 AI 项目范围",
    pContFormMsgPlaceholder: "项目范围与需求...",
    pContFormMsgDivided: "感兴趣吗？欢迎与我们沟通。",
    pContFormBtn: "提交请求",
    inquirySuccessTitle: "已收到您的咨询",
    inquirySuccessMessage:
      "感谢您的联系。您的咨询已成功发送至我们的管理团队。我们正在审核您的需求，并将在24-48个工作小时内回复。",
    sendAnotherMessage: "发送另一条消息",
    landingSrv1Value:
      "将语音与音频转化为可用于模型训练的高质量智能数据，提升产品体验与自动化效果。",
    landingSrv2Value:
      "将视觉数据转化为高质量洞察，帮助团队更快推出更安全、更智能的 AI 产品。",
    landingSrv3Value: "将语言数据转化为可靠语境，让 AI 在不同市场更准确理解用户。",
    impactChildLabor: "童工政策",
    impactFairWage: "公平薪酬认证",
    impactWorkforcePart: "女性参与率",
    officeRegionHeadquarters: "总部",
    officeRegionDeliveryHub: "交付中心",
    officeRegionOperations: "运营中心",
    officeRegionStrategicLab: "战略实验室",
    officeRegionBusinessOffice: "商务办公室",
    officeRegionRegionalHub: "区域枢纽",
    officeDetailsPetalingJaya:
      "全球战略枢纽，负责核心 AI 数据管线与企业级合作管理。",
    officeDetailsManila:
      "旗舰交付中心，拥有 5,000+ 名专业标注员，支持多模态 AI 模型。",
    officeDetailsDavao: "高安全等级设施，专注敏感医疗数据与安全计算机视觉任务。",
    officeDetailsCebu: "战略扩展中心，支持多语言服务与专业标注交付。",
    officeDetailsShenzhen:
      "技术研发中心，将边缘计算与 human-in-the-loop 工作流融合。",
    officeDetailsTokyo: "本地化核心基地，专注日语方言细节与文化对齐。",
    officeDetailsLondon: "EMEA 战略总部，推动欧洲 AI 伦理与法规合规。",
    officeDetailsNewYork: "北美客户关系与大型项目架构中心，服务一线科技企业。",
    officeDetailsTaipei: "大中华区运营关键枢纽，提供语言专业能力与技术支持。",
  },
  bnBase: {
    footerOurTeam: "আমাদের টিম",
    footerCareers: "ক্যারিয়ার",
    footerNews: "সংবাদ",
    footerCookie: "কুকি নীতি",
    footerTerms: "শর্তাবলি",
    benefit1: "গ্লোবাল সুযোগ",
    benefit2: "অগ্রগামী AI",
    benefit3: "প্রতিযোগিতামূলক পারিশ্রমিক",
    benefit4: "ক্যারিয়ার উন্নয়ন",
    benefit5: "অন্তর্ভুক্তিমূলক সংস্কৃতি",
    benefit6: "অর্থবহ প্রভাব",
    formSectionPersonal: "ব্যক্তিগত তথ্য",
    formSectionPosition: "পদ ও অভিজ্ঞতা",
    formFirstName: "নাম",
    formFirstNamePlaceholder: "যেমন: রাহুল",
    formLastName: "পদবি",
    formLastNamePlaceholder: "যেমন: আহমেদ",
    formEmail: "ইমেইল",
    formEmailPlaceholder: "rahul@example.com",
    formPhone: "ফোন নম্বর",
    formPhonePlaceholder: "01712 345678",
    formPositionLabel: "আবেদনকৃত পদ",
    formPositionPlaceholder: "পদ নির্বাচন করুন",
    formPosAnnotator: "ডাটা অ্যানোটেটর",
    formPosAnalyst: "ডাটা অ্যানালিস্ট",
    formPosTrainer: "AI ট্রেইনার",
    formPosManager: "প্রজেক্ট ম্যানেজার",
    formPosIntern: "ইন্টার্ন",
    formExpLabel: "অভিজ্ঞতার স্তর",
    formExpPlaceholder: "অভিজ্ঞতার স্তর নির্বাচন করুন",
    formExpEntry: "এন্ট্রি লেভেল (০-২ বছর)",
    formExpMid: "মিড লেভেল (৩-৫ বছর)",
    formExpSenior: "সিনিয়র (৬+ বছর)",
    formWorkLocationLabel: "পছন্দের অফিস লোকেশন",
    formWorkLocationPlaceholder: "পছন্দের লোকেশন নির্বাচন করুন",
    formNeedHelp: "সহায়তা দরকার?",
    formResumeLabel: "রিজিউমে",
    formResumePlaceholder: "রিজিউমে আপলোড করতে ক্লিক বা ড্র্যাগ করুন",
    formResumeSub: "PDF, DOC, DOCX (সর্বোচ্চ 5MB)",
    formBtnCancel: "বাতিল",
    formRequired: "আবশ্যক",
    pContFormName: "পূর্ণ নাম",
    pContFormNamePlaceholder: "আপনার পূর্ণ নাম",
    pContFormEmail: "কর্মক্ষেত্রের ইমেইল",
    pContFormEmailPlaceholder: "email@company.com",
    pContFormOrg: "প্রতিষ্ঠান",
    pContFormOrgPlaceholder: "কোম্পানির নাম",
    pContFormMsg: "আপনার AI প্রজেক্টের পরিধি জানান",
    pContFormMsgPlaceholder: "পরিধি ও প্রয়োজনীয়তা...",
    pContFormMsgDivided: "আগ্রহী? আমাদের সাথে কথা বলুন।",
    pContFormBtn: "অনুরোধ পাঠান",
    inquirySuccessTitle: "অনুসন্ধান গ্রহণ করা হয়েছে",
    inquirySuccessMessage:
      "আমাদের সাথে যোগাযোগ করার জন্য ধন্যবাদ। আপনার অনুসন্ধান সফলভাবে আমাদের নির্বাহী টিমের কাছে পাঠানো হয়েছে। আমরা আপনার অনুরোধ পর্যালোচনা করছি এবং ২৪-৪৮ কর্মঘন্টার মধ্যে আপনাকে জানাব।",
    sendAnotherMessage: "আরেকটি বার্তা পাঠান",
    landingSrv1Value:
      "স্পিচ ও অডিওকে মডেল-রেডি ইন্টেলিজেন্সে রূপান্তর করুন, যা প্রোডাক্ট এক্সপেরিয়েন্স ও অটোমেশন ফলাফল উন্নত করে।",
    landingSrv2Value:
      "ভিজ্যুয়াল ডেটাকে উচ্চমানের ইনসাইটে রূপান্তর করুন, যাতে টিম দ্রুত ও নিরাপদভাবে আরও স্মার্ট AI পণ্য চালু করতে পারে।",
    landingSrv3Value:
      "ভাষার ডেটাকে নির্ভরযোগ্য প্রাসঙ্গে রূপান্তর করুন, যাতে AI বিভিন্ন বাজারে ব্যবহারকারীদের আরও নির্ভুলভাবে বুঝতে পারে।",
    impactChildLabor: "শিশুশ্রম নীতি",
    impactFairWage: "ন্যায্য মজুরি প্রত্যয়িত",
    impactWorkforcePart: "নারী কর্মশক্তি অংশগ্রহণ",
    officeRegionHeadquarters: "হেডকোয়ার্টার",
    officeRegionDeliveryHub: "ডেলিভারি হাব",
    officeRegionOperations: "অপারেশনস",
    officeRegionStrategicLab: "স্ট্র্যাটেজিক ল্যাব",
    officeRegionBusinessOffice: "বিজনেস অফিস",
    officeRegionRegionalHub: "রিজিওনাল হাব",
    officeDetailsPetalingJaya:
      "প্রধান AI ডেটা পাইপলাইন ও এন্টারপ্রাইজ অংশীদারিত্ব পরিচালনাকারী বৈশ্বিক কৌশলগত হাব।",
    officeDetailsManila:
      "মাল্টিমোডাল AI মডেলের জন্য ৫,০০০+ বিশেষায়িত অ্যানোটেটরসহ প্রিমিয়ার ডেলিভারি সেন্টার।",
    officeDetailsDavao:
      "সংবেদনশীল মেডিক্যাল ডেটা ও সিকিউর কম্পিউটার ভিশন কাজের জন্য উচ্চ-নিরাপত্তা সুবিধা।",
    officeDetailsCebu:
      "বহুভাষিক সাপোর্ট ও বিশেষায়িত অ্যানোটেশন সেবার কৌশলগত সম্প্রসারণ কেন্দ্র।",
    officeDetailsShenzhen:
      "এজ কম্পিউটিং ও human-in-the-loop ওয়ার্কফ্লো একীভূত করা প্রযুক্তিগত R&D কেন্দ্র।",
    officeDetailsTokyo:
      "জাপানি উপভাষার সূক্ষ্মতা ও সাংস্কৃতিক AI সামঞ্জস্যে বিশেষায়িত লোকালাইজেশন কেন্দ্র।",
    officeDetailsLondon:
      "ইউরোপীয় AI নৈতিকতা ও নিয়ন্ত্রক সম্মতি ত্বরান্বিতকারী EMEA কৌশলগত সদর দপ্তর।",
    officeDetailsNewYork:
      "টিয়ার-১ প্রযুক্তি প্রতিষ্ঠানের জন্য উত্তর আমেরিকান ক্লায়েন্ট সম্পর্ক ও বৃহৎ-স্কেল প্রকল্প আর্কিটেক্টিং কেন্দ্র।",
    officeDetailsTaipei:
      "গ্রেটার চায়না অপারেশনের জন্য গুরুত্বপূর্ণ হাব, যা ভাষাগত দক্ষতা ও প্রযুক্তিগত সহায়তা দেয়।",
  },
  hiBase: {
    footerOurTeam: "हमारी टीम",
    footerCareers: "करियर",
    footerNews: "समाचार",
    footerCookie: "कुकी नीति",
    footerTerms: "नियम व शर्तें",
    benefit1: "वैश्विक अवसर",
    benefit2: "अत्याधुनिक AI",
    benefit3: "प्रतिस्पर्धी वेतन",
    benefit4: "करियर विकास",
    benefit5: "समावेशी संस्कृति",
    benefit6: "सार्थक प्रभाव",
    formSectionPersonal: "व्यक्तिगत जानकारी",
    formSectionPosition: "पद और अनुभव",
    formFirstName: "पहला नाम",
    formFirstNamePlaceholder: "जैसे: राहुल",
    formLastName: "अंतिम नाम",
    formLastNamePlaceholder: "जैसे: शर्मा",
    formEmail: "ईमेल",
    formEmailPlaceholder: "rahul@example.com",
    formPhone: "फोन नंबर",
    formPhonePlaceholder: "98765 43210",
    formPositionLabel: "जिस पद के लिए आवेदन कर रहे हैं",
    formPositionPlaceholder: "पद चुनें",
    formPosAnnotator: "डेटा एनोटेटर",
    formPosAnalyst: "डेटा विश्लेषक",
    formPosTrainer: "AI ट्रेनर",
    formPosManager: "प्रोजेक्ट मैनेजर",
    formPosIntern: "इंटर्न",
    formExpLabel: "अनुभव स्तर",
    formExpPlaceholder: "अनुभव स्तर चुनें",
    formExpEntry: "एंट्री लेवल (0-2 वर्ष)",
    formExpMid: "मिड लेवल (3-5 वर्ष)",
    formExpSenior: "सीनियर (6+ वर्ष)",
    formWorkLocationLabel: "पसंदीदा कार्यालय स्थान",
    formWorkLocationPlaceholder: "पसंदीदा स्थान चुनें",
    formNeedHelp: "मदद चाहिए?",
    formResumeLabel: "रिज़्यूमे",
    formResumePlaceholder: "रिज़्यूमे अपलोड करने के लिए क्लिक या ड्रैग करें",
    formResumeSub: "PDF, DOC, DOCX (अधिकतम 5MB)",
    formBtnCancel: "रद्द करें",
    formRequired: "आवश्यक",
    pContFormName: "पूरा नाम",
    pContFormNamePlaceholder: "आपका पूरा नाम",
    pContFormEmail: "कार्य ईमेल",
    pContFormEmailPlaceholder: "email@company.com",
    pContFormOrg: "संगठन",
    pContFormOrgPlaceholder: "कंपनी का नाम",
    pContFormMsg: "अपने AI प्रोजेक्ट का दायरा बताएं",
    pContFormMsgPlaceholder: "स्कोप और आवश्यकताएँ...",
    pContFormMsgDivided: "रुचि है? हमसे बात करें।",
    pContFormBtn: "अनुरोध भेजें",
    inquirySuccessTitle: "आपकी पूछताछ प्राप्त हुई",
    inquirySuccessMessage:
      "संपर्क करने के लिए धन्यवाद। आपकी पूछताछ हमारी एग्जीक्यूटिव टीम को सफलतापूर्वक भेज दी गई है। हम आपके अनुरोध की समीक्षा कर रहे हैं और 24-48 कार्य घंटों के भीतर आपसे संपर्क करेंगे।",
    sendAnotherMessage: "एक और संदेश भेजें",
    landingSrv1Value:
      "स्पीच और ऑडियो को मॉडल-रेडी इंटेलिजेंस में बदलें, जिससे प्रोडक्ट अनुभव और ऑटोमेशन परिणाम बेहतर हों।",
    landingSrv2Value:
      "विज़ुअल डेटा को उच्च-गुणवत्ता इनसाइट्स में बदलें ताकि टीमें सुरक्षित और स्मार्ट AI उत्पाद तेज़ी से लॉन्च कर सकें।",
    landingSrv3Value:
      "भाषा डेटा को विश्वसनीय कॉन्टेक्स्ट में बदलें ताकि AI अलग-अलग बाज़ारों में उपयोगकर्ताओं को अधिक सटीकता से समझ सके।",
    impactChildLabor: "बाल श्रम नीति",
    impactFairWage: "फेयर वेज प्रमाणित",
    impactWorkforcePart: "महिला कार्यबल भागीदारी",
    officeRegionHeadquarters: "मुख्यालय",
    officeRegionDeliveryHub: "डिलीवरी हब",
    officeRegionOperations: "ऑपरेशंस",
    officeRegionStrategicLab: "स्ट्रैटेजिक लैब",
    officeRegionBusinessOffice: "बिज़नेस ऑफिस",
    officeRegionRegionalHub: "रीजनल हब",
    officeDetailsPetalingJaya:
      "मुख्य AI डेटा पाइपलाइनों और एंटरप्राइज़ साझेदारियों का प्रबंधन करने वाला वैश्विक रणनीतिक केंद्र।",
    officeDetailsManila:
      "मल्टीमॉडल AI मॉडलों के लिए 5,000+ विशेषज्ञ एनोटेटरों वाला प्रमुख डिलीवरी सेंटर।",
    officeDetailsDavao:
      "संवेदनशील मेडिकल डेटा और सुरक्षित कंप्यूटर विज़न कार्यों पर केंद्रित उच्च-सुरक्षा सुविधा।",
    officeDetailsCebu:
      "बहुभाषी सपोर्ट और विशेषज्ञ एनोटेशन सेवाओं को सक्षम करने वाला रणनीतिक विस्तार केंद्र।",
    officeDetailsShenzhen:
      "एज कंप्यूटिंग को human-in-the-loop वर्कफ़्लो से जोड़ने वाला तकनीकी R&D केंद्र।",
    officeDetailsTokyo:
      "जापानी बोलियों की सूक्ष्मताओं और सांस्कृतिक AI संरेखण में विशेषज्ञ लोकलाइज़ेशन केंद्र।",
    officeDetailsLondon:
      "यूरोपीय AI एथिक्स और नियामकीय अनुपालन को आगे बढ़ाने वाला EMEA रणनीतिक मुख्यालय।",
    officeDetailsNewYork:
      "Tier 1 टेक कंपनियों के लिए नॉर्थ अमेरिका क्लाइंट रिलेशंस और बड़े प्रोजेक्ट आर्किटेक्चर का केंद्र।",
    officeDetailsTaipei:
      "ग्रेटर चाइना संचालन के लिए महत्वपूर्ण कड़ी, जो भाषाई विशेषज्ञता और तकनीकी समर्थन प्रदान करती है।",
  },
  koBase: {
    footerOurTeam: "우리 팀",
    footerCareers: "채용",
    footerNews: "뉴스",
    footerCookie: "쿠키 정책",
    footerTerms: "이용약관",
    benefit1: "글로벌 기회",
    benefit2: "최첨단 AI",
    benefit3: "경쟁력 있는 보상",
    benefit4: "커리어 성장",
    benefit5: "포용적 문화",
    benefit6: "의미 있는 임팩트",
    formSectionPersonal: "개인 정보",
    formSectionPosition: "포지션 및 경력",
    formFirstName: "이름",
    formFirstNamePlaceholder: "예: 민준",
    formLastName: "성",
    formLastNamePlaceholder: "예: 김",
    formEmail: "이메일",
    formEmailPlaceholder: "minjun.kim@example.com",
    formPhone: "전화번호",
    formPhonePlaceholder: "010 1234 5678",
    formPositionLabel: "지원 포지션",
    formPositionPlaceholder: "포지션 선택",
    formPosAnnotator: "데이터 어노테이터",
    formPosAnalyst: "데이터 분석가",
    formPosTrainer: "AI 트레이너",
    formPosManager: "프로젝트 매니저",
    formPosIntern: "인턴",
    formExpLabel: "경력 수준",
    formExpPlaceholder: "경력 수준 선택",
    formExpEntry: "주니어 (0-2년)",
    formExpMid: "중급 (3-5년)",
    formExpSenior: "시니어 (6년 이상)",
    formWorkLocationLabel: "희망 근무지",
    formWorkLocationPlaceholder: "희망 근무지 선택",
    formNeedHelp: "도움이 필요하신가요?",
    formResumeLabel: "이력서",
    formResumePlaceholder: "클릭 또는 드래그하여 이력서 업로드",
    formResumeSub: "PDF, DOC, DOCX (최대 5MB)",
    formBtnCancel: "취소",
    formRequired: "필수",
    pContFormName: "성함",
    pContFormNamePlaceholder: "이름을 입력하세요",
    pContFormEmail: "업무용 이메일",
    pContFormEmailPlaceholder: "email@company.com",
    pContFormOrg: "소속 조직",
    pContFormOrgPlaceholder: "회사명",
    pContFormMsg: "AI 프로젝트 범위를 알려주세요",
    pContFormMsgPlaceholder: "범위와 요구사항...",
    pContFormMsgDivided: "관심이 있으신가요? 함께 논의해 보세요.",
    pContFormBtn: "요청 보내기",
    inquirySuccessTitle: "문의가 접수되었습니다",
    inquirySuccessMessage:
      "문의해 주셔서 감사합니다. 귀하의 문의는 경영진 팀에 성공적으로 전달되었습니다. 현재 내용을 검토 중이며 24-48 영업시간 내에 회신드리겠습니다.",
    sendAnotherMessage: "다른 메시지 보내기",
    landingSrv1Value:
      "음성 및 오디오를 모델 적용 가능한 인텔리전스로 전환해 제품 경험과 자동화 성과를 향상합니다.",
    landingSrv2Value:
      "시각 데이터를 고품질 인사이트로 전환해 팀이 더 안전하고 스마트한 AI 제품을 더 빠르게 출시하도록 돕습니다.",
    landingSrv3Value:
      "언어 데이터를 신뢰할 수 있는 맥락으로 전환해 AI가 다양한 시장에서 사용자를 더 정확히 이해하도록 합니다.",
    impactChildLabor: "아동 노동 정책",
    impactFairWage: "공정 임금 인증",
    impactWorkforcePart: "여성 인력 참여율",
    officeRegionHeadquarters: "본사",
    officeRegionDeliveryHub: "딜리버리 허브",
    officeRegionOperations: "운영",
    officeRegionStrategicLab: "전략 연구소",
    officeRegionBusinessOffice: "비즈니스 오피스",
    officeRegionRegionalHub: "리저널 허브",
    officeDetailsPetalingJaya:
      "핵심 AI 데이터 파이프라인과 엔터프라이즈 파트너십을 총괄하는 글로벌 전략 허브입니다.",
    officeDetailsManila:
      "5,000명 이상의 전문 어노테이터가 근무하는 멀티모달 AI 핵심 딜리버리 센터입니다.",
    officeDetailsDavao:
      "민감한 의료 데이터와 보안 컴퓨터 비전 작업에 특화된 고보안 시설입니다.",
    officeDetailsCebu:
      "다국어 지원과 전문 어노테이션 서비스를 담당하는 전략적 확장 허브입니다.",
    officeDetailsShenzhen:
      "엣지 컴퓨팅과 human-in-the-loop 워크플로를 통합하는 기술 R&D 센터입니다.",
    officeDetailsTokyo:
      "일본어 방언 뉘앙스와 문화적 AI 정합성에 특화된 로컬라이제이션 거점입니다.",
    officeDetailsLondon:
      "유럽 AI 윤리와 규제 준수를 주도하는 EMEA 전략 본부입니다.",
    officeDetailsNewYork:
      "Tier 1 테크 기업을 위한 북미 고객 관계 및 대규모 프로젝트 아키텍처를 담당하는 거점입니다.",
    officeDetailsTaipei:
      "중화권 운영의 핵심 허브로서 언어 전문성과 기술 지원을 제공합니다.",
  },
};

function blockRange(baseName) {
  const start = src.indexOf(`const ${baseName}: TranslationSet = {`);
  if (start === -1) throw new Error(`Missing block: ${baseName}`);
  const idx = localeOrder.indexOf(baseName);
  const nextName = localeOrder[idx + 1];
  const end = nextName
    ? src.indexOf(`const ${nextName}: TranslationSet = {`, start)
    : src.indexOf("export const TRANSLATIONS", start);
  if (end === -1) throw new Error(`Missing end for: ${baseName}`);
  return { start, end };
}

for (const [baseName, entries] of Object.entries(fixes)) {
  const { start, end } = blockRange(baseName);
  let block = src.slice(start, end);

  for (const [key, value] of Object.entries(entries)) {
    const lineRegex = new RegExp(`^\\s{2}${key}:\\s*".*",?\\s*$`, "m");
    const targetLine = `  ${key}: ${JSON.stringify(value)},`;

    if (lineRegex.test(block)) {
      block = block.replace(lineRegex, targetLine);
    } else {
      block = block.replace(/\n};\s*$/, `\n${targetLine}\n};`);
    }
  }

  src = src.slice(0, start) + block + src.slice(end);
}

fs.writeFileSync(path, src, "utf8");
console.log("Locale encoding fixes applied for zh/bn/hi/ko.");
