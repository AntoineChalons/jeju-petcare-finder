// Translation dictionaries for every user-facing string in the app.
// Keys are grouped by UI area so it's easy to see what's still missing
// when a new string is added — every language object must have the same
// key shape as `en`.

export const SUPPORTED_LOCALES = ['en', 'zh', 'ja', 'ko'];
export const DEFAULT_LOCALE = 'en';

export const LOCALE_META = {
  en: { label: 'English', short: 'EN' },
  zh: { label: '中文', short: '中文' },
  ja: { label: '日本語', short: '日本語' },
  ko: { label: '한국어', short: '한국어' }
};

export const translations = {
  en: {
    title: 'Jeju Pet Care Finder',
    subtitle: 'Find pet services on Jeju Island — grooming, training, boarding, day care, walking and sitting. Click a row or a map marker for details and booking links.',
    loading: 'Loading database...',
    errorLoading: 'Error loading database: {error}',
    dbStatus: '[DB] rows loaded: {total} | mappable: {mappable} | unmappable: {unmappable}',
    dbWarnUnmappable: '{count} place(s) missing GPS coordinates:',
    languageSwitcher: { label: 'Change language' },
    services: {
      boarding: 'Boarding',
      houseSitting: 'House sitting',
      dropInVisit: 'Drop-in visits',
      doggyDayCare: 'Doggy day care',
      dogWalking: 'Dog walking',
      grooming: 'Grooming',
      petTraining: 'Pet training'
    },
    petTypes: {
      dogs: 'Dogs',
      cats: 'Cats',
      small_pets: 'Small pets'
    },
    table: {
      name: 'Name',
      city: 'City',
      services: 'Services',
      rating: 'Rating',
      price: 'From (KRW)',
      booking: 'Booking',
      map: 'Map',
      book: 'book',
      mapLink: 'map',
      emptyValue: '-'
    },
    filters: {
      city: 'City',
      petType: 'Pet type',
      services: 'Services',
      allCities: 'All cities',
      allPetTypes: 'All pets',
      reset: 'Reset filters',
      showingAll: 'Showing all {total} places',
      showingFiltered: 'Showing {filtered} of {total} places'
    },
    drawer: {
      title: 'Place details',
      close: 'Close details',
      sectionAbout: 'About',
      sectionServices: 'Services',
      sectionContact: 'Contact',
      sectionReviews: 'Reviews',
      sectionReviewsPlatform: 'Platform reviews',
      sectionReviewsLocal: 'From local pet owners',
      city: 'City',
      address: 'Address',
      petTypes: 'Pets accepted',
      languages: 'Languages',
      price: 'Price from',
      website: 'Website',
      naverMap: 'Naver Map',
      bookNow: 'Book now',
      noServices: 'No confirmed services yet.',
      noContact: 'No contact details on record.',
      reviewsPending: 'No reviews collected yet.',
      reviewCount: '{count} reviews',
      reviewChecked: 'checked {date}',
      reviewStale: 'may be outdated',
      emptyValue: '-',
      contactEmail: 'Email',
      contactMobilePhone: 'Phone',
      contactWhatsapp: 'WhatsApp',
      contactKakaotalk: 'KakaoTalk',
      contactNaverTalk: 'Naver Talk',
      contactInstagram: 'Instagram',
      sourceNaverMap: 'Naver Map',
      sourceNaverBlog: 'Naver Blog',
      sourceKakaoMap: 'Kakao Map',
      sourceGoogleMaps: 'Google Maps',
      sourceInstagram: 'Instagram',
      sourcePetbacker: 'PetBacker'
    },
    footer: {
      prompt: 'Spotted an error or a missing place?',
      link: 'Suggest an edit on GitHub'
    }
  },

  zh: {
    title: '济州宠物服务地图',
    subtitle: '查找济州岛的宠物服务——美容、训练、寄养、日托、遛狗和上门照看。点击表格行或地图标记查看详情和预约链接。',
    loading: '正在加载数据库...',
    errorLoading: '数据库加载失败：{error}',
    dbStatus: '[DB] 已加载行数：{total} | 可标注：{mappable} | 无法标注：{unmappable}',
    dbWarnUnmappable: '{count} 家店铺缺少 GPS 坐标：',
    languageSwitcher: { label: '切换语言' },
    services: {
      boarding: '宠物寄养',
      houseSitting: '住家照看',
      dropInVisit: '上门探访',
      doggyDayCare: '狗狗日托',
      dogWalking: '遛狗服务',
      grooming: '宠物美容',
      petTraining: '宠物训练'
    },
    petTypes: {
      dogs: '狗',
      cats: '猫',
      small_pets: '小型宠物'
    },
    table: {
      name: '名称',
      city: '城市',
      services: '服务',
      rating: '评分',
      price: '起价（韩元）',
      booking: '预约',
      map: '地图',
      book: '预约',
      mapLink: '地图',
      emptyValue: '-'
    },
    filters: {
      city: '城市',
      petType: '宠物类型',
      services: '服务',
      allCities: '所有城市',
      allPetTypes: '所有宠物',
      reset: '重置筛选',
      showingAll: '显示全部 {total} 家店铺',
      showingFiltered: '显示 {filtered} / {total} 家店铺'
    },
    drawer: {
      title: '店铺详情',
      close: '关闭详情',
      sectionAbout: '基本信息',
      sectionServices: '服务项目',
      sectionContact: '联系方式',
      sectionReviews: '评价',
      sectionReviewsPlatform: '平台评价',
      sectionReviewsLocal: '本地宠物主人的评价',
      city: '城市',
      address: '地址',
      petTypes: '接待宠物',
      languages: '语言',
      price: '起价',
      website: '官网',
      naverMap: 'Naver 地图',
      bookNow: '立即预约',
      noServices: '暂无已确认的服务。',
      noContact: '暂无联系方式。',
      reviewsPending: '暂未收集到评价。',
      reviewCount: '{count} 条评价',
      reviewChecked: '核实于 {date}',
      reviewStale: '可能已过期',
      emptyValue: '-',
      contactEmail: '邮箱',
      contactMobilePhone: '电话',
      contactWhatsapp: 'WhatsApp',
      contactKakaotalk: 'KakaoTalk',
      contactNaverTalk: 'Naver Talk',
      contactInstagram: 'Instagram',
      sourceNaverMap: 'Naver 地图',
      sourceNaverBlog: 'Naver 博客',
      sourceKakaoMap: 'Kakao 地图',
      sourceGoogleMaps: '谷歌地图',
      sourceInstagram: 'Instagram',
      sourcePetbacker: 'PetBacker'
    },
    footer: {
      prompt: '发现错误或遗漏的店铺？',
      link: '在 GitHub 上提出修改建议'
    }
  },

  ja: {
    title: '済州ペットケア検索',
    subtitle: '済州島のペットサービスを探せます——トリミング、しつけ、ペットホテル、保育園、散歩代行、シッティング。行や地図のマーカーをクリックすると詳細と予約リンクが見られます。',
    loading: 'データベースを読み込み中...',
    errorLoading: 'データベースの読み込みエラー：{error}',
    dbStatus: '[DB] 読み込み行数：{total} | 地図表示可：{mappable} | 表示不可：{unmappable}',
    dbWarnUnmappable: 'GPS座標のない店舗が {count} 件あります：',
    languageSwitcher: { label: '言語を変更' },
    services: {
      boarding: 'ペットホテル',
      houseSitting: 'ハウスシッティング',
      dropInVisit: '訪問ケア',
      doggyDayCare: '犬の保育園',
      dogWalking: '散歩代行',
      grooming: 'トリミング',
      petTraining: 'しつけ・訓練'
    },
    petTypes: {
      dogs: '犬',
      cats: '猫',
      small_pets: '小動物'
    },
    table: {
      name: '名前',
      city: '都市',
      services: 'サービス',
      rating: '評価',
      price: '料金（ウォン〜）',
      booking: '予約',
      map: '地図',
      book: '予約',
      mapLink: '地図',
      emptyValue: '-'
    },
    filters: {
      city: '都市',
      petType: 'ペットの種類',
      services: 'サービス',
      allCities: 'すべての都市',
      allPetTypes: 'すべてのペット',
      reset: 'フィルターをリセット',
      showingAll: '全 {total} 件を表示中',
      showingFiltered: '{total} 件中 {filtered} 件を表示中'
    },
    drawer: {
      title: '店舗詳細',
      close: '詳細を閉じる',
      sectionAbout: '基本情報',
      sectionServices: 'サービス',
      sectionContact: '連絡先',
      sectionReviews: 'レビュー',
      sectionReviewsPlatform: 'プラットフォームのレビュー',
      sectionReviewsLocal: '地元の飼い主から',
      city: '都市',
      address: '住所',
      petTypes: '対応ペット',
      languages: '言語',
      price: '料金',
      website: 'ウェブサイト',
      naverMap: 'Naver地図',
      bookNow: '今すぐ予約',
      noServices: '確認済みのサービスはまだありません。',
      noContact: '連絡先情報がありません。',
      reviewsPending: 'レビューはまだ収集されていません。',
      reviewCount: 'レビュー {count} 件',
      reviewChecked: '{date} 確認',
      reviewStale: '古い可能性があります',
      emptyValue: '-',
      contactEmail: 'メール',
      contactMobilePhone: '電話',
      contactWhatsapp: 'WhatsApp',
      contactKakaotalk: 'カカオトーク',
      contactNaverTalk: 'Naverトーク',
      contactInstagram: 'Instagram',
      sourceNaverMap: 'Naver地図',
      sourceNaverBlog: 'Naverブログ',
      sourceKakaoMap: 'Kakao地図',
      sourceGoogleMaps: 'Googleマップ',
      sourceInstagram: 'Instagram',
      sourcePetbacker: 'PetBacker'
    },
    footer: {
      prompt: '間違いや掲載漏れを見つけましたか？',
      link: 'GitHubで修正を提案する'
    }
  },

  ko: {
    title: '제주 펫케어 파인더',
    subtitle: '제주도의 반려동물 서비스를 찾아보세요 — 미용, 훈련, 펫호텔, 유치원, 산책 대행, 돌봄. 행이나 지도 마커를 클릭하면 상세 정보와 예약 링크를 볼 수 있습니다.',
    loading: '데이터베이스 불러오는 중...',
    errorLoading: '데이터베이스 로딩 오류: {error}',
    dbStatus: '[DB] 불러온 행: {total} | 지도 표시 가능: {mappable} | 표시 불가: {unmappable}',
    dbWarnUnmappable: 'GPS 좌표가 없는 업체 {count}곳:',
    languageSwitcher: { label: '언어 변경' },
    services: {
      boarding: '펫호텔',
      houseSitting: '입주 돌봄',
      dropInVisit: '방문 돌봄',
      doggyDayCare: '강아지 유치원',
      dogWalking: '산책 대행',
      grooming: '미용',
      petTraining: '훈련'
    },
    petTypes: {
      dogs: '강아지',
      cats: '고양이',
      small_pets: '소동물'
    },
    table: {
      name: '이름',
      city: '도시',
      services: '서비스',
      rating: '평점',
      price: '최저가 (원)',
      booking: '예약',
      map: '지도',
      book: '예약',
      mapLink: '지도',
      emptyValue: '-'
    },
    filters: {
      city: '도시',
      petType: '반려동물 종류',
      services: '서비스',
      allCities: '모든 도시',
      allPetTypes: '모든 반려동물',
      reset: '필터 초기화',
      showingAll: '전체 {total}곳 표시 중',
      showingFiltered: '{total}곳 중 {filtered}곳 표시 중'
    },
    drawer: {
      title: '업체 상세 정보',
      close: '상세 정보 닫기',
      sectionAbout: '소개',
      sectionServices: '서비스',
      sectionContact: '연락처',
      sectionReviews: '리뷰',
      sectionReviewsPlatform: '플랫폼 리뷰',
      sectionReviewsLocal: '제주 반려인들의 이야기',
      city: '도시',
      address: '주소',
      petTypes: '가능한 반려동물',
      languages: '언어',
      price: '최저가',
      website: '웹사이트',
      naverMap: '네이버 지도',
      bookNow: '지금 예약하기',
      noServices: '확인된 서비스가 아직 없습니다.',
      noContact: '등록된 연락처가 없습니다.',
      reviewsPending: '아직 수집된 리뷰가 없습니다.',
      reviewCount: '리뷰 {count}개',
      reviewChecked: '{date} 확인',
      reviewStale: '오래된 정보일 수 있음',
      emptyValue: '-',
      contactEmail: '이메일',
      contactMobilePhone: '전화',
      contactWhatsapp: 'WhatsApp',
      contactKakaotalk: '카카오톡',
      contactNaverTalk: '네이버 톡톡',
      contactInstagram: '인스타그램',
      sourceNaverMap: '네이버 지도',
      sourceNaverBlog: '네이버 블로그',
      sourceKakaoMap: '카카오맵',
      sourceGoogleMaps: '구글 지도',
      sourceInstagram: '인스타그램',
      sourcePetbacker: 'PetBacker'
    },
    footer: {
      prompt: '잘못된 정보나 누락된 업체를 발견하셨나요?',
      link: 'GitHub에서 수정 제안하기'
    }
  }
};
