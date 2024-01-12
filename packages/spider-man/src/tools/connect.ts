import path from 'node:path'
import { doubanSpecial } from '../data/douban-special'
import { readFileSync, writeFileSync } from 'node:fs'
import { CFAToDouDicMap, DouToCFADicMap } from '../types'
export interface Douban {
  doubanId: number
  douName: string
  douyear: number
  commentCount: number
  score: number
  poster: string
  movieId: number
  movieName: string
  movieMinute: number
  movieTime: string
}
export const same = [
  1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
  24, 25, 26, 27, 28, 29, 30, 31, 32, 34, 35, 37, 38, 39, 40, 41, 42, 43, 44,
  45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
  64, 65, 66, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 80, 81, 82, 84, 85,
  86, 87, 88, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104,
  105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119,
  120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134,
  135, 136, 137, 138, 139, 141, 142, 143, 144, 145, 146, 147, 148, 150, 151,
  152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166,
  167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181,
  182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 194, 195, 196, 197,
  198, 199, 200, 201, 203, 205, 206, 208, 209, 210, 212, 213, 214, 215, 218,
  219, 220, 221, 222, 223, 224, 225, 227, 228, 229, 230, 231, 232, 233, 234,
  236, 237, 238, 239, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257,
  258, 259, 260, 261, 262, 264, 265, 266, 268, 269, 270, 271, 272, 273, 274,
  275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289,
  290, 291, 292, 293, 295, 296, 297, 298, 299, 300, 301, 302, 305, 306, 307,
  308, 309, 310, 311, 314, 315, 316, 317, 318, 319, 320, 321, 322, 324, 327,
  328, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 350,
  352, 353, 354, 355, 356, 357, 358, 359, 360, 362, 363, 364, 365, 366, 367,
  368, 369, 370, 371, 372, 373, 374, 375, 377, 382, 388, 389, 390, 391, 392,
  393, 394, 395, 396, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411,
  412, 413, 414, 415, 416, 417, 418, 419, 420, 422, 423, 425, 426, 427, 428,
  429, 430, 431, 432, 433, 434, 435, 436, 439, 442, 443, 444, 445, 446, 448,
  449, 451, 452, 453, 454, 455, 456, 457, 458, 459, 461, 462, 503, 504, 505,
  506, 507, 508, 509, 511, 512, 513, 514, 515, 516, 517, 518, 519, 521, 528,
  536, 539, 540, 542, 543, 544, 549, 550, 553, 554, 558, 559, 561, 563, 566,
  568, 570, 574, 576, 580, 585, 589, 592, 597, 600, 601, 603, 605, 606, 615,
  643, 645, 649, 658, 665, 667, 668, 674, 683, 684, 685, 688, 689, 691, 692,
  693, 694, 695, 696, 699, 700, 701, 702, 703, 704, 706, 707, 708, 709, 710,
  712, 714, 716, 717, 718, 719, 720, 721, 722, 723, 724, 726, 727, 728, 729,
  731, 732, 737, 738, 739, 741, 742, 743, 744, 745, 746, 747, 748, 749, 750,
  751, 754, 755, 756, 757, 760, 761, 762, 763, 764, 766, 767, 769, 770, 771,
  780, 782, 783, 784, 788, 789, 790, 791, 792, 794, 795, 800, 801, 802, 803,
  804, 805, 806, 807, 808, 809, 810, 812, 819, 820, 821, 822, 823, 825, 827,
  828, 829, 830, 831, 832, 835, 837, 838, 839, 840, 841, 842, 843, 845, 846,
  847, 848, 849, 850, 851, 852, 853, 855, 868, 873, 874, 875, 877, 878, 879,
  880, 881, 882, 883, 884, 885, 886, 887, 888, 889, 890, 891, 892, 893, 894,
  895, 896, 897, 898, 899, 902, 909, 911, 912, 913, 914, 915, 916, 917, 918,
  919, 920, 921, 922, 925, 927, 928, 929, 930, 931, 932, 933, 934, 935, 936,
  937, 938, 939, 945, 950, 952, 953, 954, 955, 956, 957, 958, 959, 960, 961,
  962, 963, 964, 965, 966, 967, 968, 969, 972, 973, 974, 975, 976, 977, 978,
  981, 982, 983, 984, 985, 986, 987, 988, 989, 990, 991, 994, 995, 996, 997,
  998, 999, 1000, 1001, 1002, 1007, 1009, 1010, 1011, 1014, 1016, 1018, 1019,
  1021, 1022, 1023, 1024, 1033, 1037, 1038, 1041, 1042, 1043, 1044, 1045, 1046,
  1048, 1049, 1051, 1052, 1053, 1054, 1056, 1057, 1058, 1059, 1060, 1061, 1063,
  1065, 1066, 1067, 1068, 1069, 1070, 1071, 1072, 1074, 1076, 1078, 1080, 1081,
  1082, 1083, 1084, 1085, 1086, 1087, 1089, 1090, 1092, 1094, 1095, 1097, 1098,
  1099, 1100, 1112, 1113, 1115, 1124, 1125, 1126, 1127, 1128, 1130, 1131, 1133,
  1135, 1140, 1148, 1149, 1150, 1152, 1155, 1156, 1157, 1159, 1161, 1162, 1163,
  1164, 1166, 1167, 1168, 1169, 1171, 1172, 1177, 1182, 1183, 1184, 1185, 1186,
  1187, 1188, 1189, 1190, 1192, 1193, 1194, 1195, 1196, 1197, 1198, 1199, 1200,
  1201, 1202, 1203, 1204, 1205, 1206, 1207, 1219, 1221, 1222, 1223, 1224, 979,
  1005, 1012, 1020, 1039, 1047, 1062, 1064, 1073, 1091, 1123, 1132, 1170, 421,
  424, 437, 438, 441, 460, 510, 529, 534, 535, 537, 538, 541, 545, 556, 565,
  577, 579, 598, 613, 621, 679, 711, 715, 730, 733, 736, 752, 781, 793, 797,
  798, 140, 1225, 1226, 1227, 1228, 1231, 1232, 1236, 1237, 1238, 1174, 1248,
  1252, 1253, 1254, 1255, 1256, 1257, 1258, 1259, 1260, 1261, 1262, 1266, 1268,
  1278, 1279, 1280, 1281, 1282, 1283, 1284, 1285, 1288, 1289, 1290, 1291, 1293,
  1294, 1295, 1296, 1297, 1298, 1299, 1300, 1301, 1303, 1304, 1306, 1307, 1308,
  1309, 1310, 1311, 1312, 1313, 1314, 1315, 1316, 1317, 1318, 1319, 1320, 1321,
  1322, 1323, 1324, 1325, 1326, 1327, 1328, 1329, 1330, 1331, 1332, 1333, 1334,
  1335, 1336, 1337, 1338, 1339, 1340, 1341, 1342, 1344, 1345, 1346, 1347, 1348,
  1350, 1351, 1352, 1353, 1355, 1356, 1357, 1358, 1359, 1360, 1361, 1366, 1367,
  1368, 1420, 1425, 1426, 1427, 1428, 1429, 1431, 1432, 1434, 1435, 1437, 1438,
  1440, 1443, 1444, 1445, 1446, 1447, 1450, 1451, 1452, 1456, 1457, 1458, 1459,
  1460, 1461, 1462, 1463, 1464, 1465, 1466, 1467, 1468, 1469, 1470, 1471, 1472,
  1473, 1474, 1475, 1476, 1477, 1478, 1479, 1480, 1481, 1482, 1483, 1484, 1486,
  1489, 1490, 1491, 1492, 1493, 1494, 1495, 1496, 1497, 1500, 1502, 1503, 1505,
  1506, 1507, 1508, 1509, 1510, 1513, 1515, 1517, 1518, 1519, 1520, 1521, 1245,
  1246, 1247, 1272, 1277, 1378, 1379, 1380, 1381, 1230, 1249, 1274, 1302, 1305,
  1511, 1512, 1514, 1522, 1524, 1526, 1528, 1529, 1530, 1531, 1533, 1537, 1539,
  1543, 1545, 1535, 1538, 1540, 1541,
]

const remarks: { [id: number]: string } = {
  903: '《一江春水向东流》分为八年离乱和天亮前后上下两集，总时长192分钟，资料馆时长92分钟，可能是只播放了后集',
  491: '错误页面',
  494: '错误页面',
}

const time = Date.now()
const chacePath = path.resolve(__dirname, '../.cache')
const dataPath = path.resolve(__dirname, '../data')
const todoPickPath = `${chacePath}/todo-pick-list.json`
const cfaToDouDicMapPath = `${dataPath}/cfa-to-dou-dic-map.json`
const douToCFADicMapPath = `${dataPath}/dou-to-cfa-dic-map.json`

async function pick() {
  const todoPickStr = await readFileSync(todoPickPath, {
    encoding: 'utf-8',
    flag: 'r',
  })
  const cfaToDouDicMapStr = await readFileSync(cfaToDouDicMapPath, {
    encoding: 'utf-8',
    flag: 'r',
  })
  const todoPick: Douban[] = JSON.parse(todoPickStr)
  const cfaToDouDicMap: CFAToDouDicMap = JSON.parse(cfaToDouDicMapStr)
  const different: [number, string][] = []
  for (const current of todoPick) {
    const id = current.movieId
    if (cfaToDouDicMap[id]) continue
    if (doubanSpecial[id]) {
      cfaToDouDicMap[id] = {
        movieId: current.movieId,
        movieName: current.movieName,
        movieMinute: current.movieMinute,
        movieTime: current.movieTime,
        updateTime: doubanSpecial[id].updateTime,
        douban: doubanSpecial[id].douban,
      }
      if (remarks[id]) cfaToDouDicMap[id].remark = remarks[id]
      continue
    }
    if (same.includes(Number(id))) {
      cfaToDouDicMap[id] = {
        movieId: current.movieId,
        movieName: current.movieName,
        movieMinute: current.movieMinute,
        movieTime: current.movieTime,
        updateTime: time,
        douban: [
          {
            id: current.doubanId,
            name: current.douName,
            year: current.douyear,
            score: current.score,
            commentCount: current.commentCount,
            poster: current.poster,
          },
        ],
      }
      continue
    }
    different.push([id, current.movieName])
  }
  writeFileSync(cfaToDouDicMapPath, JSON.stringify(cfaToDouDicMap))
  console.log(JSON.stringify(different))
}

async function erverseMap() {
  const cfaToDouDicMapStr = await readFileSync(cfaToDouDicMapPath, {
    encoding: 'utf-8',
    flag: 'r',
  })
  const cfaToDouDicMap: CFAToDouDicMap = JSON.parse(cfaToDouDicMapStr)
  const douToCFADicMap: DouToCFADicMap = {}

  for (const movieId in cfaToDouDicMap) {
    const current = cfaToDouDicMap[movieId]
    for (const douban of current.douban) {
      if (!Array.isArray(douToCFADicMap[douban.id])) {
        douToCFADicMap[douban.id] = []
      }
      if (current.douban.length > 1) {
        douToCFADicMap[douban.id].push({
          s: current.movieName,
          i: current.movieId,
        })
      } else {
        douToCFADicMap[douban.id].unshift({
          s: current.movieName,
          i: current.movieId,
        })
      }
    }
  }
  writeFileSync(douToCFADicMapPath, JSON.stringify(douToCFADicMap))
  console.log(JSON.stringify(douToCFADicMap))
}

// pick()
// erverseMap()
