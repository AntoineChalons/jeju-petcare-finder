"""
One-off seed script: writes data/places.csv and data/reviews.csv from the
2026-08-08 research pass (research/jeju-pet-services.md in the workspace).

Every row below was read from the cited Naver Map place page
(pcmap.place.naver.com/place/<id>) on 2026-08-08. Re-running this script
regenerates both CSVs deterministically; after that, the CSVs are the
source of truth and this file is only a historical record of the seed.

Usage:  python tools/seed_data.py
Then:   python tools/validate.py data/places.csv
        python tools/import_csv.py data/places.csv public/pet_services.db
"""

import csv
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from schema import CSV_COLUMNS, REVIEWS_CSV_COLUMNS  # noqa: E402

CHECKED = "2026-08-08"

T, F, U = "true", "false", ""  # tri-state service flags


def P(pid, name, city, addr, lat, lng, website, naver_id, booking,
      boarding, house, drop, daycare, walking, grooming, training,
      pets, price, price_note, langs, contacts):
    return {
        "place_id": pid,
        "name": name,
        "city": city,
        "full_address": addr,
        "gps_lat": lat,
        "gps_lng": lng,
        "website_url": website,
        "naver_map_url": f"https://pcmap.place.naver.com/place/{naver_id}/home" if naver_id else "",
        "booking_url": booking,
        "active": "",
        "boarding": boarding,
        "house_sitting": house,
        "drop_in_visit": drop,
        "doggy_day_care": daycare,
        "dog_walking": walking,
        "grooming": grooming,
        "pet_training": training,
        "pet_types": pets,
        "price_from_krw": price,
        "price_note": price_note,
        "languages_spoken": langs,
        "contact_methods": contacts,
    }


KO = "Korean"

PLACES = [
    P(1, "개스트하우스", "Jeju City", "제주 제주시 동광로6길 33 2층 (이도이동)",
      33.4995012, 126.5336324, "", 1654579915, "http://pf.kakao.com/_bDIxkG",
      T, F, F, T, U, U, U, "dogs", 25000,
      "Day care 1 day; boarding 30,000-35,000 per 24h (dogs under 6kg)", KO,
      "mobile_phone:0507-1354-3282;instagram:dogsthouse_jeju;kakaotalk:http://pf.kakao.com/_bDIxkG"),
    P(2, "댕댕놀이터", "Jeju City", "제주 제주시 도근내길 56 1층 (내도동)",
      33.491915, 126.4369423, "https://blog.naver.com/mjnliz", 1815395828,
      "http://talk.naver.com/w4vwhn",
      T, F, F, T, T, T, U, "dogs", 24000,
      "Day care full day (to 4.9kg); boarding from 35,000/night", KO,
      "mobile_phone:0507-1439-7044;instagram:dd_noriter;naver_talk:http://talk.naver.com/w4vwhn"),
    P(3, "멍더랜드", "Jeju City", "제주 제주시 월광로 147 (노형동)",
      33.4921521, 126.4733829, "https://blog.naver.com/ajdejfosem", 1460408016, "",
      T, U, U, T, U, T, U, "dogs", 20000,
      "Day care day pass; boarding from 35,000/night; pickup 1,000/km", KO,
      "mobile_phone:064-713-1067;instagram:mungthe_land"),
    P(4, "놀멍애견유치원&호텔", "Jeju City", "제주 제주시 도령로13길 13 2층 (연동)",
      33.4925237, 126.4880092, "https://blog.naver.com/pokemon010", 2090591693, "",
      T, U, U, T, U, T, U, "dogs", "", "", KO,
      "mobile_phone:0507-1479-0054;instagram:n_meong_jeju"),
    P(5, "베콩스 애견호텔&놀이터", "Jeju City", "제주 제주시 조천읍 신북로 479-2 2층 (함덕)",
      33.5435514, 126.6616432, "", 1769253582,
      "https://m.booking.naver.com/booking/6/bizes/855224/search",
      T, F, F, U, T, T, U, "dogs", 45000,
      "Boarding small room/night; walk 8,000/hr; playground 5,000/hr", KO,
      "mobile_phone:0507-1323-3560;instagram:vacance_jeju;naver_talk:http://talk.naver.com/w4ho4j"),
    P(6, "코기절미", "Jeju City", "제주 제주시 월성로4길 70 (용담이동)",
      33.4989195, 126.4989038, "", 1243516961, "",
      T, U, U, T, U, U, U, "dogs", "", "", KO,
      "mobile_phone:0507-1339-5740;instagram:corgi_jeolmi"),
    P(7, "앙리젤", "Jeju City", "제주 제주시 노형12길 23 지성빌딩 2층 (노형동)",
      33.4826192, 126.4804908, "", 1951173139, "",
      T, F, F, T, F, T, T, "dogs", "", "Day care/hotel for small dogs under 8kg", KO,
      "mobile_phone:0507-1320-0062;instagram:ang_rizel_salon"),
    P(8, "핏어팻", "Jeju City", "제주 제주시 연동7길 24 2층 (연동)",
      33.4877532, 126.4905944, "", 1657640918, "",
      T, U, U, T, U, T, U, "dogs", "", "", KO,
      "mobile_phone:0507-1410-3993;instagram:pitapat_dog_j"),
    P(9, "호야별 애견유치원", "Jeju City", "제주 제주시 원남2길 29 (도남동)",
      33.4848144, 126.5220487, "", 1754202114, "http://pf.kakao.com/_xjWlGG",
      T, U, U, T, U, U, T, "dogs", "", "100% advance booking", KO,
      "mobile_phone:0507-1485-0556;instagram:hoya.byeol;kakaotalk:http://pf.kakao.com/_xjWlGG"),
    P(10, "초록동산 강아지호텔&유치원", "Jeju City", "제주 제주시 오광로 93 1층 (이호이동)",
      33.4878747, 126.4595979, "", 2096926396, "",
      T, U, U, T, U, U, U, "dogs", 45000,
      "Day care 1 visit; large-dog boarding 80,000/night", KO,
      "mobile_phone:0507-1399-9076;instagram:jeju_greendog"),
    P(11, "꼬망스펫", "Jeju City", "제주 제주시 광평중길 69 3층 (노형동)",
      33.4800797, 126.4681778, "", 1940904888, "",
      T, U, U, T, U, T, U, "dogs", 30000,
      "Boarding/night under 5kg (bands to 10kg)", KO,
      "mobile_phone:0507-1487-9883;instagram:ccomangs_pet"),
    P(12, "해피애견", "Jeju City", "제주 제주시 오라로1길 20-9 (오라삼동)",
      33.4979903, 126.5079383, "http://제주해피애견.kr", 1916450066, "",
      T, U, U, T, U, T, U, "dogs", "", "", KO,
      "mobile_phone:064-744-2702"),
    P(13, "도곤도곤 애견미용실", "Jeju City", "제주 제주시 성신로1길 21 2층 203호 (연동)",
      33.491852, 126.4877027, "", 1604434591, "",
      U, U, U, U, U, T, U, "dogs, cats", "",
      "Advance booking with 20,000 deposit", KO,
      "instagram:dogon_dogjeju"),
    P(14, "몽쥬르", "Jeju City", "제주 제주시 신설로 55 한일베라체상가 101호 (이도이동)",
      33.4941437, 126.5485384, "https://blog.naver.com/jeju_monjour", 1344320680,
      "https://m.booking.naver.com/booking/13/bizes/899424",
      F, F, F, F, F, T, F, "dogs, cats", 55000,
      "VIP member groom pass (short coat); premium full groom 75,000; no weight surcharge", KO,
      "mobile_phone:010-9458-7036;instagram:monjour_salon;naver_talk:http://talk.naver.com/w41nr3"),
    P(15, "위드더독", "Jeju City", "제주 제주시 복지로북길 29 (도남동)",
      33.4890775, 126.5233919, "", 1805812926, "https://open.kakao.com/o/sAigagFf",
      U, U, U, U, U, T, U, "dogs", "", "Stress-free grooming, booking via Kakao/DM", KO,
      "mobile_phone:0507-1391-2503;instagram:_with_the_dog;kakaotalk:https://open.kakao.com/o/sAigagFf;naver_talk:http://talk.naver.com/w4srlg"),
    P(16, "독티비티 반려견 트레이닝 센터", "Jeju City", "제주 제주시 애월읍 하귀7길 30 (하귀)",
      33.4846225, 126.4165433, "", 1268520029, "http://pf.kakao.com/_tuCwn",
      T, U, U, T, U, U, T, "dogs", "", "Small and large dogs", KO,
      "mobile_phone:0507-1349-0379;instagram:dogtivity_multi_trainingcenter;kakaotalk:http://pf.kakao.com/_tuCwn;naver_talk:http://talk.naver.com/w4ejiz"),
    P(17, "포브독 반려견 교육센터", "Jeju City", "제주 제주시 연북로 74 세화빌딩 2층 (연동)",
      33.4815317, 126.4891751, "", 1265968331, "http://pf.kakao.com/_wGvbxj",
      F, U, U, T, U, F, T, "dogs", 50000,
      "Group class/session; 1:1 lesson 100,000; day care 10-pass from 350,000", KO,
      "mobile_phone:070-8287-1465;instagram:fobdog_official;kakaotalk:http://pf.kakao.com/_wGvbxj"),
    P(18, "제주펫스쿨", "Seogwipo", "제주 서귀포시 대정읍 칠전로 438 2층 (신도리)",
      33.2864217, 126.223061,
      "https://www.notion.so/JEJUPETSCHOOL-28f8ce18579980a2a98cd9c97a6604d0", 1479061383, "",
      U, U, U, T, U, U, T, "dogs", "", "", KO,
      "mobile_phone:0507-1365-4504;instagram:jps_care"),
    P(19, "포썸도그 센터", "Seogwipo", "제주 서귀포시 대정읍 영어도시로 92 1층 (구억리)",
      33.2802141, 126.2801437, "https://pawsomedogcenter.com/", 1957095625,
      "https://pawsomedogcenter.com/",
      T, F, F, T, F, T, T, "dogs", "",
      "Temperament test before enrolment; English-speaking staff", "Korean, English",
      "instagram:pawsomedog_official"),
    P(20, "왈도그케어플레이스", "Seogwipo", "제주 서귀포시 대정읍 중산간서로 2197 (구억리)",
      33.2794712, 126.2930485, "", 1369449049, "",
      T, U, U, T, U, T, U, "dogs", "", "Separate small-dog and large-dog areas", KO,
      "instagram:wal_dcp_official"),
    P(21, "담담유치원", "Seogwipo", "제주 서귀포시 토평남로48번길 18 (토평동)",
      33.2623951, 126.5920263, "", 2092902734, "https://open.kakao.com/o/sNyrYE7h",
      T, U, U, T, U, U, U, "dogs", 20000,
      "Day care day pass under 5kg (bands to 11kg); 100% advance booking", KO,
      "mobile_phone:0507-1393-0962;instagram:damdam.kinder;kakaotalk:https://open.kakao.com/o/sNyrYE7h"),
    P(22, "싱글몽글", "Seogwipo", "제주 서귀포시 일주동로 8510 (토평동)",
      33.2555958, 126.5788874, "", 1178876259, "",
      T, U, U, T, U, T, U, "dogs", 20000,
      "Day care day pass; grooming from 35,000; boarding from 35,000/night", KO,
      "mobile_phone:0507-1389-5745;instagram:single._.mongle"),
    P(23, "그루밍제주", "Seogwipo", "제주 서귀포시 천제연로 357 (회수동)",
      33.2525089, 126.442915, "", 1979286000, "",
      U, U, U, U, U, T, U, "dogs", "", "", KO,
      "mobile_phone:0507-1488-7577;instagram:grooming_jeju"),
    P(24, "몽블리 펫샵", "Seogwipo", "제주 서귀포시 안덕면 녹차분재로 41 1층 (서광리)",
      33.2893441, 126.302008, "", 1160756296, "",
      T, U, U, T, U, T, U, "dogs, cats", "",
      "Walk service included during boarding; sedation-free cat grooming", KO,
      "mobile_phone:0507-1344-0329;instagram:petshopmongvely"),
    P(25, "우프 애견운동장&유치원", "Seogwipo", "제주 서귀포시 남원읍 하신로 302 (신례리)",
      33.280432, 126.6318865, "", 1050898853,
      "https://m.booking.naver.com/booking/6/bizes/1657995/search",
      T, U, U, T, U, U, U, "dogs", 5000, "Dog admission to playground field", KO,
      "mobile_phone:0507-1397-1281;instagram:woof_jeju"),
    P(26, "제주펫시터 토닥", "Jeju City", "제주 제주시 삼봉로 284 (도련일동)",
      33.4977279, 126.5940954, "https://blog.naver.com/petsitter_todak", 1717355757,
      "https://open.kakao.com/o/sodW2zYf",
      F, T, T, F, T, F, T, "dogs", "",
      "Visiting sitter: care at your home; certified behaviour instructor", KO,
      "mobile_phone:0507-1385-0591;instagram:jejupet.todak;kakaotalk:https://open.kakao.com/o/sodW2zYf;naver_talk:http://talk.naver.com/w4d0g7"),
    P(27, "산책의 고수", "Jeju City", "제주 제주시 한경면 저지14길 47-2 (저지리)",
      33.3411546, 126.2648314, "", 2086707663, "",
      F, U, T, F, T, F, F, "dogs, cats", 10000,
      "Cat home visit; dog home visit incl. walk 20,000", KO,
      "mobile_phone:0507-1346-1085"),
    P(28, "로이즈 펫시터", "Jeju City", "제주 제주시 애월읍 고하상로 101-2 1동 2층 (하가리)",
      33.457032, 126.3477297, "", 1439001711, "",
      T, U, U, T, T, F, F, "dogs", 4000,
      "Hourly day care; 24h home-style boarding 39,000 (max 5 dogs/day)", KO,
      "instagram:roys_pet_sitter_2025"),
    P(29, "말랑포레스트&키티포레스트", "Jeju City", "제주 제주시 한경면 녹차분재로 354 (저지리)",
      33.3082606, 126.2815265, "", 2071611792, "",
      T, T, T, T, T, F, F, "dogs, cats", "",
      "Dog hotel + separate cat hotel; visiting care offered", KO,
      "mobile_phone:0507-1448-3188;instagram:mallang_forest_jeju"),
    P(30, "제주애견훈련학교", "Jeju City", "제주 제주시 삼의영길 72 (아라일동)",
      33.461906, 126.5535514, "http://cafe.naver.com/jejudogschool", 1034415056, "",
      T, U, U, U, U, U, T, "dogs", "", "Large-dog specialist; in-home training available", KO,
      "mobile_phone:0507-1447-9205"),
    P(31, "김재신반려견스쿨", "Seogwipo", "제주 서귀포시 표선면 돈오름로 170 허브동산 (표선)",
      33.3291241, 126.8147261, "http://cafe.naver.com/howtospeakdog", 719370899, "",
      T, U, U, U, U, U, T, "dogs", "",
      "Behaviour correction, agility, IGP; medium/large dogs", KO,
      "mobile_phone:0507-1409-2873;instagram:jeju_dog_training_center"),
    P(32, "도담도그 스쿨", "Jeju City", "제주 제주시 조천읍 대흘6길 77-37 (대흘리)",
      33.4884077, 126.6678957, "", 1088890263, "",
      U, U, U, T, U, U, T, "dogs", "", "Large outdoor training field", KO,
      "mobile_phone:0507-1439-0839;instagram:dodam_dogschool.jeju;naver_talk:http://talk.naver.com/w5itwh"),
    P(33, "놀멍쉬멍고르멍", "Seogwipo", "제주 서귀포시 현청로 51 (서홍동)",
      33.2657042, 126.5558813, "", 442893274, "",
      U, U, U, U, U, U, U, "dogs", "", "Small-dog park & cafe (small dogs only)", KO,
      "mobile_phone:0507-1409-2405;instagram:meong_3"),
    P(34, "도그앤캣", "Seogwipo", "제주특별자치도 서귀포시 홍중로 119-2 601동 107호 (서홍동)",
      "", "", "", "", "",
      T, U, U, U, U, T, U, "dogs", "", "", KO,
      "mobile_phone:0507-1308-7585"),
]


def R(pid, source, rating, count, review_path, quote="", alias="", lang=""):
    """Platform review row (naver_map visitor tab)."""
    return {
        "place_id": pid, "source": source, "kind": "platform",
        "rating": rating, "review_count": count,
        "url": f"https://pcmap.place.naver.com/place/{review_path}/review/visitor",
        "summary_or_quote": quote, "author_alias": alias,
        "quoted_at": "", "lang": lang, "last_checked": CHECKED,
    }


def Q(pid, quote, alias):
    """Local owner quote row (from Naver visitor reviews, anonymized)."""
    return {
        "place_id": pid, "source": "local_owner", "kind": "local_owner",
        "rating": "", "review_count": "", "url": "",
        "summary_or_quote": quote, "author_alias": alias,
        "quoted_at": "", "lang": "ko", "last_checked": "",
    }


REVIEWS = [
    R(1, "naver_map", 5.0, 14, 1654579915),
    Q(1, "벌써 몇번째인지 모르겠어요~ 늘 갈때마다 저리 싱글벙글이예요… 선생님들 항상 감사해요", "소형견 견주, 제주시"),
    R(2, "naver_map", 4.61, 48, 1815395828),
    Q(2, "엄청 낯을 가리는 강아지인데도… 유치원을 너무너무 좋아한답니다… 왕복 20km를 다니고 있어요", "유치원 단골 견주"),
    Q(2, "45일 간격으로 미용하는데, 제주 아니, 전국에서 가장 합리적인 가격으로 아주 잘하시고, 친절하십니다", "미용 단골 견주"),
    R(3, "naver_map", 4.9, 31, 1460408016),
    Q(3, "멍더랜드에는 실내와 잔디가 있어서 아이들이 신나게 뛰기 좋아요! 선생님들도 사랑으로 아이들을 케어해주셔서 벌써 율무가 다닌지 2년반이 넘었어요", "2년차 단골 견주"),
    R(4, "naver_map", 5.0, 11, 2090591693),
    Q(4, "이번에 온가족이 여행을 가게되서 놀멍에 호텔링을 하게되었습니다… 놀멍 선생님들이 너무 잘 보살펴주셔서 첫날부터 바로 마음이 놓였어요", "호텔링 이용 견주"),
    R(5, "naver_map", 4.75, 25, 1769253582),
    Q(5, "급하게 맡길 곳이 필요했는데 사장님 24시간 계시고… 잘 돌봐주셔서 감사합니다", "함덕 여행객"),
    R(6, "naver_map", 4.69, 24, 1243516961),
    Q(6, "4박5일 여행 일정 때문에 6일 호텔링 이용했습니다… 사장님께서 성향체크부터, 낯설지 않도록 적응하게 도와주시고, 자는시간·먹는거·노는사진 체크해서 사진보내주셨어요", "장기 호텔링 견주"),
    R(7, "naver_map", "", 53, 1951173139),
    Q(7, "미용 트라우마로 미용 한번 하고 오면 일주일내내 밥을 잘 안먹을 정도로 엄청 고생했는데~ 앙리젤을 알게된 후 미용도 잘하고… 벌써 n년차 단골입니다", "노형동 단골 견주"),
    R(8, "naver_map", 4.92, 80, 1657640918),
    Q(8, "2년넘게 다니고 있습니다 24시간이라 덕분에 스케줄 근무시 편하게 일하면서 꾸르 맡길 수 있어 넘 좋아요", "교대근무 견주"),
    R(9, "naver_map", "", 10, 1754202114),
    Q(9, "여행중에 애견동반이 안되는곳이 있어서 데이케어를 맡기게 됬는데 원장님이 친절하시고 강아지를 사랑하는게 느껴졌어요", "여행객 견주"),
    R(10, "naver_map", "", 67, 2096926396),
    Q(10, "사장님 세상 친절하고 야외공간에 불멍 존도 있어서 감성적이고 신나게 놀다왔어요", "방문 견주"),
    R(11, "naver_map", 4.56, 107, 1940904888),
    Q(11, "동글동글 귀엽게 잘라주셔서 많은 분들이 이뻐해주고 있어요… 꼬망스에서는 너무 타이트하게 미용하지 않으셔서", "미용 단골 견주"),
    R(12, "naver_map", "", 6, 1916450066),
    Q(12, "제주여행에서 시간계산을 잘못해서 급하게 유치원 하루 맡겼는데, 너무 친절하시고 중간중간 영상 사진도 너무 좋았어요… 가격도 짱 착했어요", "여행객 견주"),
    R(13, "naver_map", 4.83, 164, 1604434591),
    Q(13, "미용솜씨야 말모인데 강아지 어디가 안좋은지 얘기해주시는데 그게 너무 감사해요… 이런 애정있는 애견미용실 본적이 없어요", "연동 단골 견주"),
    R(14, "naver_map", 4.91, 147, 1344320680),
    Q(14, "미용도 너무잘해주시고 친절하셔서… 제주도 고양이 미용 꼭 여기서 하세요!!", "고양이 집사"),
    R(15, "naver_map", 5.0, 93, 1805812926),
    Q(15, "알림장도 꼼꼼하게 보내주시고 케어도 너무 잘 해주셔서 아마 평생 다니지 않을까 싶습니다", "도남동 단골 견주"),
    R(16, "naver_map", "", 32, 1268520029),
    Q(16, "애견유치원은 처음인데 상담도 친절하게 잘 해주시고 맞춤으로 케어해주셔서… 호텔링도 예약해놨습니당", "유치원 신규 견주"),
    R(17, "naver_map", "", 28, 1265968331),
    Q(17, "포브독은 상담때부터 전문적인 설명과 강아지를 너무 이뻐하시는게 느껴져서 선택했습니다… 아이들이 흥분하지 않는 상태에서 만나게해주시더라고요", "행동교정 수강 견주"),
    R(18, "naver_map", "", 3, 1479061383),
    Q(18, "전문적이고 친절히 설명해주셔서 너무 좋았어요", "훈련 상담 견주"),
    R(21, "naver_map", "", 3, 2092902734),
    Q(21, "설 연휴 3박4일 동안 호텔 맡겼는데, 아주 잘 지낸것 같아요. 먹는 것, 싸는 것 등 건강상태 꼼꼼히 봐주시고, 산책까지", "연휴 호텔링 견주"),
    R(22, "naver_map", "", 10, 1178876259),
    Q(22, "토리가 5개월도 안되어 간 첫 유치원이라 걱정이 많이했는데… 잘 돌봐주셔서 감사했습니다", "퍼피 견주, 서귀포"),
    R(23, "naver_map", 4.85, 73, 1979286000),
    Q(23, "울 퐁듀 넘 이쁘게 미용 잘해주셨어요~~~ 3개월 기다리느라 털이 많이 길었어서 걱정했는데… 묭실 유목민 이었는데 이제 그루밍제주에 정착하려고요", "중문 단골 견주"),
    R(24, "naver_map", 4.63, 23, 1160756296),
    Q(24, "몽블리 펫샵 강아지에 꼭 필요한 물품을 구매하기 좋아요", "안덕면 견주"),
    R(25, "naver_map", 5.0, 69, 1050898853),
    Q(25, "제주도에서 여기보다 더 좋은 애견운동장은 없는듯해요", "남원읍 견주"),
    R(33, "naver_map", 4.89, 91, 442893274),
]


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(root, "data")
    os.makedirs(data_dir, exist_ok=True)

    places_path = os.path.join(data_dir, "places.csv")
    with open(places_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        w.writeheader()
        w.writerows(PLACES)
    print(f"wrote {places_path} ({len(PLACES)} places)")

    reviews_path = os.path.join(data_dir, "reviews.csv")
    with open(reviews_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=REVIEWS_CSV_COLUMNS)
        w.writeheader()
        w.writerows(REVIEWS)
    print(f"wrote {reviews_path} ({len(REVIEWS)} review rows)")


if __name__ == "__main__":
    main()
