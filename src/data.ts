import { Milestone, DragItem, QuizQuestion, CollaborativeTask, GalleryImage, FamilyStory } from "./types";

// Import historical images
import imgTuyenCu from "../img/ttxvn_2504_tong_tuyen_cu15.jpg";
import imgTemPhieu from "../img/8-suu-tam-tem-phieu-1616868825647.jpg";
import imgWv2_3430 from "../img/W_v2-3430.jpg";
import imgW00042 from "../img/W_img00042.jpg";
import imgW00106 from "../img/W_img00106.jpg";
import imgW00263 from "../img/W_img00263.jpg";
import imgDH5 from "../img/DH5.jpg";
import imgGhep from "../img/ghep_20231020181937.jpg";
import img1_37 from "../img/1-37.jpg";

export const MILESTONES: Milestone[] = [
  {
    id: "milestone-1",
    year: "1975 - 1976",
    title: "Hoàn thành thống nhất đất nước về mặt nhà nước",
    subTitle: "",
    brief: "Đảng đề ra nhiệm vụ thống nhất hai chính quyền khác nhau ở hai miền sau năm 1975: Chính phủ Việt Nam Dân chủ Cộng hòa (Miền Bắc) và Chính phủ cách mạng lâm thời Cộng hòa miền Nam Việt Nam (Miền Nam).",
    content: "Hội nghị Trung ương 24 khóa III (8/1975) đề ra chủ trương đưa cả nước tiến nhanh, tiến mạnh lên chủ nghĩa xã hội; hoàn thành thống nhất nước nhà, chống âm mưu chia rẽ. Miền Bắc tiếp tục đẩy mạnh xây dựng CNXH và hoàn thiện quan hệ sản xuất xã hội chủ nghĩa; miền Nam đồng thời tiến hành cải tạo xã hội chủ nghĩa và xây dựng chủ nghĩa xã hội.",
    image: imgTuyenCu,
    imageMetadata: {
      caption: "Cử tri bỏ phiếu bầu cử Quốc hội khóa VI (Quốc hội chung của nước Việt Nam thống nhất) ngày 25/04/1976.",
      author: "Thông tấn xã Việt Nam (TTXVN)",
      date: "25/04/1976",
      place: "Việt Nam",
      archiveId: "TTX-1976-0425",
      category: "Sự kiện Lịch sử",
      detailedContext: "Sau chiến thắng mùa Xuân năm 1975, nguyện vọng thiết tha của nhân dân cả nước là sớm thống nhất đất nước về mặt Nhà nước. Cuộc Tổng tuyển cử ngày 25/04/1976 là mốc lịch sử vĩ đại, bầu ra Quốc hội chung quyết định đặt tên nước là Cộng hòa Xã hội chủ nghĩa Việt Nam, đặt thủ đô tại Hà Nội, bầu ra bộ máy lãnh đạo tối cao và thành lập Ủy ban dự thảo Hiến pháp."
    },
    details: {
      narrative: "Hoàn thành thống nhất nước nhà về mặt nhà nước là cơ sở để thống nhất đất nước trên các lĩnh vực khác, nhanh chóng tạo ra sức mạnh toàn diện; là điều kiện tiên quyết để đưa cả nước quá độ lên chủ nghĩa xã hội. Điều này thể hiện tư duy chính trị nhạy bén của Đảng trong bước chuyển giai đoạn cách mạng.",
      interactiveType: "ballot",
      chronoEvents: [
        {
          title: "Phiên họp đặc biệt",
          date: "27/10/1975",
          desc: "Ủy ban Thường vụ Quốc hội nước Việt Nam Dân chủ Cộng hòa họp bàn chủ trương, biện pháp thống nhất nước nhà về mặt nhà nước."
        },
        {
          title: "Hội nghị Hiệp thương chính trị",
          date: "15 - 21/11/1975",
          desc: "Hai đoàn đại biểu Bắc - Nam khẳng định Việt Nam là một khối thống nhất và cần sớm đồng bộ về mặt Nhà nước. Quyết định tổ chức Tổng tuyển cử theo các nguyên tắc dân chủ (phổ thông, bình đẳng, trực tiếp, bỏ phiếu kín)."
        },
        {
          title: "Chỉ thị số 228",
          date: "03/01/1976",
          desc: "Bộ Chính trị Trung ương Đảng ra văn bản nêu rõ tầm quan trọng của cuộc Tổng tuyển cử và giao trách nhiệm cho các cấp ủy lãnh đạo cuộc bầu cử."
        },
        {
          title: "Tổng tuyển cử toàn quốc",
          date: "25/04/1976",
          desc: "Cuộc Tổng tuyển cử bầu Quốc hội chung được tiến hành với hơn 23 triệu cử tri tham gia, bầu ra 492 đại biểu đại diện cho nhân dân cả nước của nước Việt Nam thống nhất."
        },
        {
          title: "Kỳ họp thứ nhất Quốc hội",
          date: "24/06 - 03/07/1976",
          desc: "Quốc hội nước Việt Nam thống nhất họp tại Thủ đô Hà Nội và đưa ra các quyết định lịch sử:\n\n• Tên nước & Biểu tượng: Đổi tên nước thành Cộng hòa Xã hội chủ nghĩa Việt Nam; đặt Thủ đô tại Hà Nội; giữ nguyên Quốc kỳ (nền đỏ sao vàng), Quốc ca (Tiến quân ca) và xác định mẫu Quốc huy chính thức.\n\n• Đổi tên thành phố: Thành phố Sài Gòn chính thức đổi tên thành Thành phố Hồ Chí Minh.\n\n• Bộ máy lãnh đạo: Chủ tịch nước (Tôn Đức Thắng); Phó Chủ tịch nước (Nguyễn Lương Bằng, Nguyễn Hữu Thọ); Chủ tịch Quốc hội (Trường Chinh); Thủ tướng Chính phủ (Phạm Văn Đồng).\n\n• Hiến pháp: Thành lập Ủy ban để dự thảo Hiến pháp mới cho đất nước."
        }
      ]
    }
  },
  {
    id: "milestone-2",
    year: "1976",
    title: "Đại hội đại biểu toàn quốc lần thứ IV của Đảng",
    subTitle: "Đại hội lần thứ IV của Đảng họp từ ngày 14 đến ngày 20-12-1976",
    brief: "Hội nghị có ý nghĩa lịch sử sâu sắc để đổi tên Đảng thành Đảng Cộng sản Việt Nam và thiết lập các mục tiêu kinh tế - xã hội lâu dài đặt trong bối cảnh hòa bình vừa lập lại.",
    content: "Đại hội đã thông qua Báo cáo chính trị, phương hướng kế hoạch 5 năm (1976-1980), Báo cáo xây dựng Đảng, tổng kết cuộc kháng chiến chống Mỹ cứu nước.",
    details: {
      interactiveType: "limitations4",
      narrative: "Đại hội IV chỉ ra ba đặc điểm lớn của cách mạng Việt Nam giai đoạn này:\n1. Hòa bình nhưng đất nước còn chịu hậu quả chiến tranh nặng nề, tàn dư chủ nghĩa thực dân.\n2. Cuộc đối đầu ý thức hệ còn diễn ra rất quyết liệt trên thế giới.\n3. Kinh tế nước ta còn phổ biến là sản xuất nhỏ tiến thẳng lên chủ nghĩa xã hội, bỏ qua tư bản chủ nghĩa (đây là đặc điểm lớn nhất).\n\nĐường lối chung: Sử dụng chuyên chính vô sản và quyền làm chủ tập thể của nhân dân; tiến hành đồng thời 3 cuộc cách mạng (cách mạng quan hệ sản xuất, cách mạng khoa học - kỹ thuật là then chốt, cách mạng tư tưởng và văn hóa); xây dựng xã hội mới với 4 đặc trưng (chế độ mới, nền sản xuất lớn, văn hóa mới, con người mới).\n\nĐường lối kinh tế: Đẩy mạnh công nghiệp hóa làm trọng tâm. Ưu tiên phát triển công nghiệp nặng một cách hợp lý trên cơ sở phát triển nông nghiệp và công nghiệp nhẹ. Mở rộng quan hệ kinh tế quốc tế, ưu tiên hợp tác với các nước xã hội chủ nghĩa.\n\nAn ninh - đối ngoại: Giữ vững nhiệm vụ quốc phòng, an ninh chủ quyền; củng cố quan hệ đặc biệt với Lào, Campuchia; hợp tác toàn diện với Liên Xô.",
      extraNarrative: "⚠️ Hạn chế mang tính lịch sử của Đại hội IV (1976):\n\n• Nhận thức mô hình: Chưa tổng kết kinh nghiệm thực tế ở miền Bắc thời chiến nên chưa phát hiện ra các khuyết tật của mô hình kinh tế bao cấp khi chuyển sang thời bình.\n• Mục tiêu và thời gian: Có phần nóng vội khi dự kiến hoàn thành thời kỳ quá độ (đưa nền kinh tế lên sản xuất lớn) chỉ trong vòng 20 năm.\n• Chỉ tiêu kinh tế: Đề ra các chủ trương thiếu thực tế, bao gồm việc ưu tiên công nghiệp nặng quy mô lớn và đặt chỉ tiêu nông - công nghiệp vượt quá khả năng thực hiện thực tế."
    }
  },
  {
    id: "milestone-3",
    year: "1979 - 1981",
    title: "Những bước đột phá kinh tế đầu tiên",
    subTitle: "Thử nghiệm vượt rào và khởi đầu tháo gỡ rào cản hành chính",
    brief: "Trước khó khăn kinh tế gay gắt do cơ chế quản lý tập trung và thiên tai, Đảng đã có những bước thử nghiệm thực tế đầy quả cảm để tháo gỡ khó khăn trong sản xuất nông - công nghiệp.",
    content: "Các văn bản Hội nghị Trung ương 6 (1979), Chỉ thị 100-CT/Trung ương (1981), Quyết định 25-CP và 26-CP đã mở đường cho các hoạt động kinh tế tự chủ, giải phóng năng lực lao động.",
    image: imgWv2_3430,
    imageMetadata: {
      caption: "Bức tranh tường cổ động tại trung tâm thành phố Hà Nội ngày 04/10/1980.",
      author: "Leo Goulet (UNICEF)",
      date: "04/10/1980",
      place: "Hà Nội, Việt Nam",
      archiveId: "LG-1980-HN-3430",
      category: "Đô thị & Nghệ thuật",
      detailedContext: "Giai đoạn đầu thập niên 1980, các bức tranh cổ động đường phố tại trung tâm Hà Nội đóng vai trò vô cùng quan trọng trong việc cổ vũ tinh thần vượt khó của nhân dân lao động cả nước, thúc đẩy tinh thần sản xuất nông - công nghiệp, vượt qua khủng hoảng kinh tế thời kỳ bao cấp."
    },
    details: {
      interactiveType: "breakthroughs",
      narrative: "Quá trình này trải qua 3 cột mốc đột phá vô cùng ý nghĩa:\n\n1. Hội nghị Trung ương 6 (08/1979) - Bước đột phá đầu tiên:\nChủ trương khắc phục sai lầm quản lý, phá bỏ rào cản để cho 'sản xuất bung ra'. Chính phủ thực hiện miễn thuế cho đất khai hoang, phục hóa; cho phép người dân hưởng toàn bộ sản phẩm tự làm ra; xóa bỏ các trạm kiểm soát để tự do lưu thông hàng hóa trên thị trường.\n\n2. Chỉ thị 100-CT/Trung ương (01/1981) - Đổi mới trong nông nghiệp:\nChính thức thừa nhận và nhân rộng hình thức 'khoán chui' (khoán sản phẩm đến nhóm và người lao động). Người dân tự làm các khâu cấy, chăm sóc, thu hoạch; phần sản lượng vượt mức khoán được toàn quyền sở hữu và tự do mua bán. Kết quả: Nông gia đồng lòng ủng hộ, kích thích tinh thần lao động; sản lượng lương thực tăng mạnh.\n\n3. Quyết định 25-CP & 26-CP (01/1981) - Tháo gỡ trong công nghiệp:\nBan hành quyền chủ động sản xuất kinh doanh, tự chủ tài chính cho xí nghiệp quốc doanh; mở rộng hình thức trả lương khoán, lương sản phẩm và vận dụng tiền thưởng linh hoạt. Kết quả: Kích thích xí nghiệp tự lập, sản xuất công nghiệp đạt kế hoạch đề ra, công nghiệp địa phương vượt kế hoạch."
    }
  },
  {
    id: "milestone-4",
    year: "1978 - 1979",
    title: "Đấu tranh bảo vệ chủ quyền biên giới Tổ quốc",
    subTitle: "Kiên cường giữ vững chủ quyền quốc gia ở hai đầu biên giới",
    brief: "Bên cạnh công cuộc khôi phục và xây dựng kinh tế đầy gian khổ, quân và dân Việt Nam đã phải trực tiếp cầm súng chiến đấu kiên cường bảo vệ lãnh thổ quốc gia ở biên giới Tây Nam và phía Bắc.",
    content: "Các cuộc xung đột biên giới nổ ra buộc Việt Nam phải tiến hành chiến tranh tự vệ chính nghĩa ở cả hai miền biên viễn.",
    details: {
      interactiveType: "borderMap",
      narrative: "Nhấn vào từng khu vực trên sơ đồ để xem diễn biến cụ thể của hai cuộc chiến tranh bảo vệ Tổ quốc vĩ đại:",
      points: [
        "Bảo vệ biên giới phía Tây Nam: • Từ tháng 4-1975, tập đoàn Pôn Pốt đã thi hành chính sách diệt chủng ở Campuchia và tăng cường chống Việt Nam, xâm phạm lãnh thổ Việt Nam. \n\n• Từ ngày 26/12/1978, quân tình nguyện Việt Nam phối hợp cùng quân dân cách mạng Campuchia mở cuộc tổng tiến công chính nghĩa, giải phóng thủ đô Phnôm Pênh vào ngày 07/01/1979, cứu nhân dân Campuchia khỏi họa diệt chủng. \n\n• Ngày 18/02/1979, hai nước ký Hiệp ước hòa bình, hữu nghị và hợp tác lâu dài.",
        "Bảo vệ biên giới phía Bắc (Tây Bắc): • Ngày 17/02/1979, Trung Quốc bất ngờ huy động hơn 60 vạn quân đồng loạt tấn công toàn tuyến biên giới phía Bắc nước ta từ Lai Châu đến Quảng Ninh.  Quân dân ta dũng cảm ngoan cường chiến đấu tự vệ. \n\n• Đến ngày 18/03/1979, trước sức kháng cự mãnh liệt và làn sóng phản đối quốc tế, quân Trung Quốc buộc phải rút hết về nước."
      ]
    }
  },
  {
    id: "milestone-5",
    year: "1982",
    title: "Đại hội đại biểu toàn quốc lần thứ V của Đảng",
    subTitle: "Đại hội V của Đảng họp tại Hà Nội từ ngày 27 đến ngày 31-3-1982",
    brief: "",
    content: "",
    image: imgDH5,
    imageMetadata: {
      caption: "Toàn cảnh Đại hội đại biểu toàn quốc lần thứ V của Đảng Cộng sản Việt Nam tại Hà Nội.",
      author: "Thông tấn xã Việt Nam (TTXVN)",
      date: "27 - 31/03/1982",
      place: "Hà Nội, Việt Nam",
      archiveId: "TTXVN-1982-DH5",
      category: "Sự kiện Lịch sử",
      detailedContext: "Đại hội đại biểu toàn quốc lần thứ V của Đảng Cộng sản Việt Nam họp tại Hà Nội từ ngày 27 đến 31/03/1982. Đại hội xác định nước ta đang ở chặng đường đầu tiên của thời kỳ quá độ lên chủ nghĩa xã hội, đề ra nhiệm vụ ổn định và cải thiện đời sống nhân dân, ưu tiên phát triển nông nghiệp, công nghiệp hàng tiêu dùng và xuất khẩu, đồng thời củng cố quốc phòng an ninh Tổ quốc."
    },
    details: {
      interactiveType: "limitations5",
      narrative: "Đại hội V mang lại những nhận thức mới và nhiệm vụ cụ thể:\n\n• Nhận thức thực tế: Khẳng định nước ta đang ở chặng đường đầu tiên của thời kỳ quá độ lên chủ nghĩa xã hội với rất nhiều khó khăn phức tạp về kinh tế, chính trị, văn hóa, xã hội.\n• Nhiệm vụ trước mắt cấp bách: Ổn định và cải thiện một bước đời sống vật chất, văn hóa của nhân dân lao động; tiếp tục xây dựng cơ sở vật chất - kỹ thuật (ưu tiên tập trung thúc đẩy sản xuất nông nghiệp, công nghiệp hàng tiêu dùng và xuất khẩu); đáp ứng tốt nhu cầu phòng thủ tối hậu của đất nước, củng cố quốc phòng và an ninh Tổ quốc.",
      extraNarrative: "⚠️ Bốn hạn chế mang tính lịch sử cần tháo gỡ của Đại hội V:\n\n1. Chưa thấy hết sự cần thiết duy trì nền kinh tế nhiều thành phần; chưa xác định rõ quan điểm kết hợp kế hoạch với thị trường và quản lý lưu thông phân phối hàng hóa.\n2. Vẫn tiếp tục chủ trương nóng vội muốn hoàn thành về cơ bản cải tạo xã hội chủ nghĩa ở miền Nam chỉ trong vòng 5 năm ngắn ngủi.\n3. Vẫn tiếp tục dồn vốn đầu tư cơ sở vật chất, kỹ thuật cho việc phát triển công nghiệp nặng một cách tràn lan, chưa hiệu quả.\n4. Chưa dứt khoát dành thêm nhiều nguồn vốn và vật tư cần thiết cho phát triển nông nghiệp và công nghiệp hàng tiêu dùng."
    }
  },
  {
    id: "milestone-6",
    year: "1984 - 1986",
    title: "Quá trình cụ thể hóa đổi mới qua các Hội nghị Trung ương",
    subTitle: "Nhận thức đột phá về Giá - Lương - Tiền và tự phê bình lịch sử",
    brief: "Giai đoạn bản lề với các quyết nghị lịch sử xóa bỏ hoàn toàn bao cấp, chuẩn bị toàn diện về mặt lý luận cho Đại hội Đổi Mới toàn quốc lần thứ VI.",
    content: "",
    image: imgTemPhieu,
    imageMetadata: {
      caption: "Cuốn sổ mua lương thực và bộ sưu tập tem phiếu thực phẩm sinh hoạt thời kỳ bao cấp.",
      author: "Tư liệu lịch sử sưu tầm",
      date: "Giai đoạn 1976 - 1985",
      place: "Việt Nam",
      archiveId: "TP-1976-1985",
      category: "Đời sống bao cấp",
      detailedContext: "Tem phiếu là cơ sở phân phối lương thực, thực phẩm thời bao cấp. Chế độ phân phối này tuy có vai trò nhất định thời chiến nhưng đã bộc lộ khuyết tật lớn trong thời bình, dẫn đến cảnh xếp hàng rườm rà, thiếu hụt lương thực triền miên. Hội nghị Trung ương 8 (06/1985) đã ra quyết sách lịch sử xóa bỏ hoàn toàn bao cấp, chuyển dứt khoát sang hạch toán kinh doanh XHCN."
    },
    details: {
      interactiveType: "couponBook",
      narrative: "Hành trình cụ thể hóa đổi mới qua các Hội nghị Trung ương khóa V:\n\n• Hội nghị Trung ương 6 (07/1984) - Giải quyết cấp bách phân phối lưu thông: Đẩy mạnh công tác thu mua lương thực, quản lý chặt thị trường tự do và điều chỉnh cơ cấu giá - lương - tiền hợp lý.\n• Hội nghị Trung ương 7 (12/1984) - Xác định mặt trận hàng đầu: Đưa sản xuất nông nghiệp (đặc biệt là lương thực, thực phẩm) trở thành trọng tâm cốt lõi của kế hoạch phát triển năm 1985.\n• Hội nghị Trung ương 8 khóa V (06/1985) - Đột phá cơ chế quản lý quyết định: Quyết nghị xóa bỏ hoàn toàn cơ chế tập trung quan liêu bao cấp, lấy cuộc cải cách 'Giá - Lương - Tiền' làm khâu đột phá táo bạo để chuyển hẳn sang hạch toán kinh doanh XHCN.",
      extraNarrative: "💥 Hội nghị Bộ Chính trị khóa V (08/1986) - Đỉnh cao tự phê bình, nhìn thẳng sự thật:\n\nĐây là cuộc sinh hoạt chính trị sâu sắc nhất, mở đầu tinh thần đổi mới với thái độ 'nhìn thẳng vào sự thật, đánh giá đúng sự thật, nói rõ sự thật':\n\n• Về cơ cấu sản xuất: Thừa nhận tâm lý chủ quan, nóng vội, đề ra một số chủ trương, công trình quá to lớn về quy mô và quá cao về nhịp độ xây dựng cơ bản, gây lãng phí nghiêm trọng.\n• Về cải tạo XHCN: Phạm nhiều sai lầm khuyết điểm trong cải tạo xã hội chủ nghĩa, can thiệp thô bạo vào nền kinh tế nhiều thành phần.\n• Về cơ chế quản lý: Khẳng định dứt khoát cần bố trí lại toàn bộ cơ cấu kinh tế phải đi đôi mật thiết với cuộc đổi mới căn bản cơ chế quản lý kinh tế để giải phóng sức sản xuất, tạo động lực mạnh mẽ thúc đẩy đời sống xã hội."
    }
  }
];

export const DRAG_ITEMS: DragItem[] = [
  {
    id: "item-1",
    text: "Nhà nước mua thấp, bán thấp và bù lỗ ngân sách",
    correctChest: "bao_cap"
  },
  {
    id: "item-2",
    text: "Tính đủ chi phí hợp lý thực tế vào giá thành sản phẩm",
    correctChest: "hach_toan"
  },
  {
    id: "item-3",
    text: "Tem phiếu mua hàng và đặt các trạm kiểm soát lưu thông",
    correctChest: "bao_cap"
  },
  {
    id: "item-4",
    text: "Khoán sản phẩm đến nhóm và người lao động (Chỉ thị 100)",
    correctChest: "hach_toan"
  },
  {
    id: "item-5",
    text: "Ưu tiên đầu tư tràn lan vào công nghiệp nặng quy mô lớn",
    correctChest: "bao_cap"
  },
  {
    id: "item-6",
    text: "Thực hiện cơ chế một giá hạch toán trong toàn bộ hệ thống",
    correctChest: "hach_toan"
  }
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Nghị quyết hay văn bản nào lần đầu thừa nhận hình thức 'khoán sản phẩm đến nhóm và người lao động' (khoán chui) trong nông nghiệp?",
    options: [
      "Hội nghị Trung ương 6 (08/1979)",
      "Chỉ thị 100-CT/Trung ương (01/1981)",
      "Quyết định 25-CP (01/1981)",
      "Nghị quyết Đại hội V (03/1982)"
    ],
    correctAnswer: 1,
    explanation: "Chỉ thị 100-CT/Trung ương ban hành tháng 1/1981 đã chính thức thừa nhận và cho phép nhân rộng mô hình 'khoán chui', làm bùng nổ năng suất lao động của nông dân."
  },
  {
    question: "Đại hội đại biểu toàn quốc lần thứ IV của Đảng (12/1976) đã đưa ra quyết sách lịch sử nào về tên gọi của Đảng?",
    options: [
      "Giữ nguyên tên Đảng Lao động Việt Nam",
      "Đổi tên thành Đảng Nhân dân Cách mạng Việt Nam",
      "Đổi tên thành Đảng Cộng sản Việt Nam",
      "Đổi tên thành Đảng Cộng sản Đông Dương"
    ],
    correctAnswer: 2,
    explanation: "Đại hội IV đã sửa đổi điều lệ và quyết định đổi tên Đảng từ Đảng Lao động Việt Nam thành Đảng Cộng sản Việt Nam."
  },
  {
    question: "Hội nghị Ban Chấp hành Trung ương nào khóa V quyết định lấy 'Giá - Lương - Tiền' làm khâu đột phá để xóa bỏ bao cấp?",
    options: [
      "Hội nghị Trung ương 6 (07/1984)",
      "Hội nghị Trung ương 7 (12/1984)",
      "Hội nghị Trung ương 8 (06/1985)",
      "Hội nghị Bộ Chính trị (08/1986)"
    ],
    correctAnswer: 2,
    explanation: "Hội nghị Trung ương 8 khóa V (06/1985) đã ghi mốc đột phá khi quyết định xóa bỏ hoàn toàn cơ chế tập trung quan liêu bao cấp, lấy cải cách 'giá - lương - tiền' hạch toán làm đòn bẩy."
  },
  {
    question: "Sự kiện lịch sử nào diễn ra vào ngày 25/04/1976 đánh dấu mốc quan trọng trong tiến trình thống nhất đất nước về mặt nhà nước?",
    options: [
      "Hội nghị Hiệp thương chính trị Bắc - Nam",
      "Tổng tuyển cử bầu Quốc hội chung (Quốc hội khóa VI)",
      "Kỳ họp thứ nhất Quốc hội khóa VI tại Hà Nội",
      "Giải phóng hoàn toàn miền Nam và Phnôm Pênh"
    ],
    correctAnswer: 1,
    explanation: "Ngày 25/04/1976, hơn 23 triệu cử tri cả nước đã tham gia Tổng tuyển cử tự do bình đẳng, bầu ra Quốc hội chung đầu tiên của nước Việt Nam thống nhất."
  },
  {
    question: "Tinh thần cốt lõi trong Hội nghị Bộ Chính trị khóa V diễn ra vào tháng 8/1986 là gì?",
    options: [
      "Tiếp tục đẩy mạnh công nghiệp nặng quy mô lớn",
      "Gia hạn cơ chế tem phiếu xã hội chủ nghĩa",
      "Đỉnh cao của tinh thần tự phê bình, 'nhìn thẳng sự thật, đánh giá đúng sự thật và nói rõ sự thật'",
      "Kêu gọi viện trợ toàn diện từ các nước tư bản phương Tây"
    ],
    correctAnswer: 2,
    explanation: "Hội nghị Bộ Chính trị (8/1986) thể hiện tinh thần cách mạng triệt để, dám nhìn thẳng vào thực tế sai lầm chủ quan nóng vội của mình để kiến thiết lại đường lối chuẩn bị cho đổi mới toàn diện."
  }
];

export const COLLABORATIVE_TASKS: CollaborativeTask[] = [
  {
    role: "ai",
    title: "Trợ lý kỹ thuật (AI)",
    details: [
      "Tối ưu hóa cấu trúc mã nguồn API hệ thống Scroll-Driven và tương tác phản hồi mượt mà.",
      "Sinh mã logic xử lý tính điểm tự động cho trò chơi kéo thả và bộ câu hỏi trắc nghiệm khách quan.",
      "Trích xuất nhanh từ khóa chính, phân loại dữ liệu thô theo trình tự biên niên sử từ văn bản gốc của tư liệu."
    ]
  },
  {
    role: "human",
    title: "Sinh viên kiểm soát (Human)",
    details: [
      "Đối chiếu và thẩm định 100% dữ liệu lịch sử Đảng (chính xác hóa mốc thời gian, tên nhân sự lãnh đạo, tên nghị quyết thực tế).",
      "Thiết lập và tinh chỉnh trải nghiệm giao diện màu sắc tươi sáng, đảm bảo tính thẩm mỹ giáo dục lịch sử hiện đại.",
      "Trực tiếp thuyết trình bày biện và phản biện thuyết phục trước hội đồng giám khảo về nội dung xây dựng hệ thống."
    ]
  }
];

export const GALLERY_IMAGES: GalleryImage[] = [
  {
    id: "gal-1",
    src: imgTuyenCu,
    title: "Tổng tuyển cử Quốc hội thống nhất",
    caption: "Cử tri bỏ phiếu bầu cử Quốc hội khóa VI ngày 25/04/1976.",
    author: "Thông tấn xã Việt Nam (TTXVN)",
    date: "25/04/1976",
    place: "Việt Nam",
    archiveId: "TTX-1976-0425",
    category: "Sự kiện Lịch sử",
    detailedContext: "Ngày 25/04/1976, cuộc Tổng tuyển cử chung trên cả nước được tiến hành với hơn 23 triệu cử tri tham gia, bầu ra 492 đại biểu đại diện cho nhân dân cả nước của nước Việt Nam thống nhất. Đây là bước đi nền tảng hoàn thành việc thống nhất đất nước về mặt Nhà nước, mở ra chương mới cho công cuộc xây dựng Xây dựng Chủ nghĩa Xã hội."
  },
  {
    id: "gal-2",
    src: imgWv2_3430,
    title: "Tranh cổ động đường phố Hà Nội",
    caption: "Bức tranh tường cổ động tại trung tâm thành phố Hà Nội ngày 04/10/1980.",
    author: "Leo Goulet (UNICEF)",
    date: "04/10/1980",
    place: "Hà Nội, Việt Nam",
    archiveId: "LG-1980-HN-3430",
    category: "Đô thị & Nghệ thuật",
    detailedContext: "Nhiếp ảnh gia người Canada Leo Goulet đã ghi lại một góc phố Hà Nội năm 1980 với bức tranh cổ động tường kích thước lớn. Bức tranh phản ánh tinh thần lao động, quyết tâm chiến đấu giữ vững biên cương của nhân dân. Tranh cổ động là một phần không thể thiếu trong nét văn hóa - chính trị đặc trưng những năm bao cấp."
  },
  {
    id: "gal-3",
    src: imgW00263,
    title: "Hội nghị ngành nước Đồng bằng sông Cửu Long",
    caption: "Hội nghị cán bộ kỹ thuật cấp thoát nước 3 tỉnh Mekong Delta phối hợp cùng UNICEF tại Rạch Giá ngày 26/08/1983.",
    author: "Leo Goulet (UNICEF)",
    date: "26/08/1983",
    place: "Rạch Giá, Kiên Giang, Việt Nam",
    archiveId: "LG-1983-RG-0263",
    category: "Hợp tác & Phát triển",
    detailedContext: "Hội thảo kỹ thuật ngành nước quy tụ các cán bộ kỹ thuật đến từ Long An, Minh Hải (Bạc Liêu, Cà Mau nay) và Kiên Giang. Chương trình hợp tác cung cấp nước sạch nông thôn giữa Chính phủ Việt Nam và UNICEF vào thập niên 1980 là điểm sáng ngoại giao và phát triển kinh tế thực tiễn trong thời kỳ bao cấp khó khăn."
  },
  {
    id: "gal-4",
    src: imgTemPhieu,
    title: "Hiện vật tem phiếu thời bao cấp",
    caption: "Cuốn sổ mua lương thực và bộ tem phiếu mua thực phẩm những năm 1980.",
    author: "Tư liệu lịch sử sưu tầm",
    date: "Giai đoạn 1976 - 1985",
    place: "Việt Nam",
    archiveId: "TP-1976-1985",
    category: "Đời sống Bao cấp",
    detailedContext: "Tem phiếu và sổ mua lương thực là những chứng từ bắt buộc để người dân nhận khẩu phần lương thực, dầu hỏa, vải vóc từ các cửa hàng mậu dịch quốc doanh. Việc quản lý bằng tem phiếu dẫn đến cảnh xếp hàng nổi tiếng thời kỳ này. Cuộc cải cách lịch sử năm 1985 đã dứt khoát xóa bỏ hình thức này để giải phóng sức mua của thị trường."
  },
  {
    id: "gal-5",
    src: imgW00042,
    title: "Đời sống trẻ em nông thôn Nam Bộ",
    caption: "Trẻ em nông thôn Bạc Liêu vây quanh chuyên gia nước ngoài chụp ảnh ngày 19/10/1980.",
    author: "Leo Goulet (UNICEF)",
    date: "19/10/1980",
    place: "Bạc Liêu (Minh Hải cũ), Việt Nam",
    archiveId: "LG-1980-BL-0042",
    category: "Đời sống Bao cấp",
    detailedContext: "Bức ảnh cho thấy vẻ mặt tò mò, rạng rỡ và nét ngây thơ của các em nhỏ nông thôn miền Tây Nam Bộ khi lần đầu tiên được tiếp xúc với máy ảnh và chuyên gia quốc tế của UNICEF. Dù hoàn cảnh đất nước lúc bấy giờ còn bộn bề gian khó, sức sống và tinh thần lạc quan vẫn hiện lên trên gương mặt thế hệ tương lai."
  },
  {
    id: "gal-6",
    src: imgW00106,
    title: "Khách sạn Caravelle (Khách sạn Độc Lập) TP.HCM",
    caption: "Khách sạn Caravelle trên đường Đồng Khởi ngày 28/02/1981.",
    author: "Leo Goulet (UNICEF)",
    date: "28/02/1981",
    place: "Quận 1, TP. Hồ Chí Minh, Việt Nam",
    archiveId: "LG-1981-SG-0106",
    category: "Đô thị & Nghệ thuật",
    detailedContext: "Bức ảnh chụp góc nhìn từ xa về khách sạn Caravelle - khi ấy mang tên Khách sạn Độc Lập - một địa điểm kiến trúc tiêu biểu tại TP. Hồ Chí Minh. Xe đạp và xích lô là các phương tiện giao thông phổ biến nhất trên các tuyến phố trung tâm Sài Gòn vào những năm đầu thập niên 1980."
  },
  {
    id: "gal-7",
    src: imgGhep,
    title: "Tổ hợp tư liệu tổng hợp thời bao cấp",
    caption: "Bản collage tư liệu xếp hàng mậu dịch, cửa hàng bách hóa và phiếu phân phối.",
    author: "Tư liệu lịch sử tổng hợp",
    date: "Giai đoạn 1975 - 1986",
    place: "Việt Nam",
    archiveId: "BAOCAP-GHEP-2023",
    category: "Tư liệu tổng hợp",
    detailedContext: "Tấm hình ghép mô tả không khí xếp hàng mua gạo, mua thịt tại các cửa hàng lương thực thời bao cấp. Những nét mặt mệt mỏi nhưng kiên nhẫn đợi đến lượt, bên cạnh là những ô tem phiếu được cắt lẻ, phản ánh chân thực thách thức của nền kinh tế chỉ huy, làm nổi bật giá trị đột phá của chính sách Đổi Mới sau đó."
  },
  {
    id: "gal-8",
    src: img1_37,
    title: "Lao động sản xuất thời kỳ Hợp tác xã",
    caption: "Hình ảnh người nông dân lao động tập thể trên đồng ruộng.",
    author: "Sưu tầm sử liệu",
    date: "Khoảng 1980",
    place: "Việt Nam",
    archiveId: "SL-1980-0137",
    category: "Đời sống Bao cấp",
    detailedContext: "Bức ảnh phản ánh mô hình lao động tập thể tại các Hợp tác xã nông nghiệp thời kỳ bao cấp trước cải cách. Dù năng suất lao động tập thể còn thấp do thiếu động lực cá nhân (phải đợi tới Chỉ thị 100 về khoán sản phẩm mới tháo gỡ), sự bền bỉ khắc khổ của người nông dân vẫn là trụ đỡ cho toàn bộ đời sống xã hội."
  }
];

export const INITIAL_STORIES: FamilyStory[] = [
  {
    id: "story-1",
    author: "Nguyễn Minh Đức (Nhóm 3 VNR201)",
    relation: "Lời kể của Ông nội (cựu cán bộ mậu dịch)",
    title: "Huyền thoại hòn gạch xếp hàng mua gạo",
    content: "Thời ấy muốn mua gạo mậu dịch ở phố Lương Ngọc Quyến, ông phải dậy từ 3 giờ sáng mang một hòn gạch viết tên mình lên đó để xếp chỗ. Có hôm gió mùa đông bắc rét buốt, ông chạy về ăn củ khoai quay ra thì hòn gạch bị ai đó vứt đi mất, thế là mất cả buổi sáng nhịn đói, phải xếp hàng lại từ đầu. Tem phiếu rách một góc coi như mất sạch tiêu chuẩn cả tháng.",
    tag: "🎫 Tem phiếu",
    color: "yellow",
    likes: 12,
    date: "25/06/2026",
    stamp: "ticket"
  },
  {
    id: "story-2",
    author: "Lê Mỹ Linh (Lớp VNR201-FPT)",
    relation: "Lời kể của Bà ngoại",
    title: "Chiếc biển số xe đạp Phượng Hoàng",
    content: "Nhà ngoại ngày xưa có chiếc xe đạp Phượng Hoàng (Phoenix) mua bằng phiếu phân phối đặc biệt của cán bộ trung cấp. Xe quý đến mức phải đăng ký biển số như xe máy bây giờ và có số khung đàng hoàng. Mỗi lần đi đâu về, ông ngoại lại lau chùi bóng loáng rồi xích chặt vào chân giường, khóa bằng 2 ổ khóa sắt mập. Mất xe đạp ngày đó là mất cả gia tài khổng lồ.",
    tag: "🚲 Đời sống",
    color: "mint",
    likes: 18,
    date: "28/06/2026",
    stamp: "bicycle"
  },
  {
    id: "story-3",
    author: "Phạm Hoàng Nam (Nhóm 1 VNR201)",
    relation: "Lời kể của Ông ngoại",
    title: "Đêm nghe loa phát thanh ngày 25/04/1976",
    content: "Ông ngoại kể đêm ngày Tổng tuyển cử 1976 bầu Quốc hội khóa VI chung, cả làng ông tập trung quanh chiếc loa phát thanh công cộng duy nhất treo trên ngọn cây đa đầu làng. Khi phát thanh viên đọc thông báo tỷ lệ cử tri đi bầu đạt hơn 98% và quyết nghị đổi tên nước thành Cộng hòa Xã hội Chủ nghĩa Việt Nam, cả làng đốt đuốc reo hò vang trời, cảm xúc thống nhất đất nước nghẹn ngào khó tả.",
    tag: "🗳️ Sự kiện",
    color: "pink",
    likes: 24,
    date: "01/07/2026",
    stamp: "radio"
  },
  {
    id: "story-4",
    author: "Đặng Tiến Dũng (Lớp VNR201)",
    relation: "Lời kể của Bố",
    title: "Cảm xúc ngày xóa bỏ sổ tem phiếu mua hàng",
    content: "Bố kể cuối năm 1985 khi có quyết định xóa bỏ bao cấp tem phiếu để chuyển sang mua bán tự do theo cơ chế một giá, mẹ bố đã òa khóc. Những cuốn sổ tem phiếu rách nát, nhăn nhúm từng là huyết mạch của gia đình được xếp gọn vào tủ làm kỷ niệm. Từ đó, người dân không còn cảnh xếp hàng rồng rắn rực lửa từ sáng sớm nữa, thị trường bỗng nhiên bung ra nhiều hàng hóa vô kể.",
    tag: "💡 Đổi mới",
    color: "cream",
    likes: 31,
    date: "02/07/2026",
    stamp: "letter"
  }
];

