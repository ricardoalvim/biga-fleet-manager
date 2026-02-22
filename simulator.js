const BASE_URL = 'http://localhost:2342'

// O trajeto que você mapeou (Lng, Lat -> Convertido para Lat, Lng para o nosso DTO)
const geoJsonData = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.437704276838105,
                    -22.64701802081221
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43851524493584,
                    -22.64672355307364
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43887419802812,
                    -22.646551779933603
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.439312918474116,
                    -22.646404545643378
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43976493347961,
                    -22.646269580738178
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.440190359367136,
                    -22.64611007658938
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.440536017900996,
                    -22.646011920096782
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.44085508731587,
                    -22.64587695480668
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.441293807761866,
                    -22.645741989382984
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.4415198152646,
                    -22.645594754224604
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.44173252820892,
                    -22.645545675803405
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.44199841938797,
                    -22.64549659736369
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.442330783362365,
                    -22.645361631567184
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.44257008542459,
                    -22.644993542354825
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.4424138693241,
                    -22.644480262028566
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.442028327113945,
                    -22.64416124938748
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.44158960666792,
                    -22.6437808871939
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.44104452974929,
                    -22.643351444741654
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.440579220185356,
                    -22.642909731103757
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.440193677975174,
                    -22.64252936544436
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43984801944134,
                    -22.642185808459004
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.439382709877464,
                    -22.641891330359883
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43894819622463,
                    -22.64158025361496
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43857594857286,
                    -22.641298044204646
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43797769341836,
                    -22.640880864015088
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43728637635172,
                    -22.640439142432413
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.436143044279646,
                    -22.63951888457298
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43476041014637,
                    -22.63852499916173
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43376331822222,
                    -22.637788783110423
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.431543126873294,
                    -22.636856237114685
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42957561057051,
                    -22.63696670906873
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.427235768190485,
                    -22.637101683114693
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42205089018913,
                    -22.63746979347495
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42053531046528,
                    -22.63765384828517
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.41979081516283,
                    -22.637911524605116
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.41953821854216,
                    -22.63869682088452
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.419471745746876,
                    -22.638954495248285
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.41939197839315,
                    -22.639531193263878
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.41928562192152,
                    -22.640144699132918
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.41920585456779,
                    -22.640598691711787
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.419152676331976,
                    -22.640807282393922
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.41912608721407,
                    -22.641089492812426
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.41904631985929,
                    -22.641322622720963
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.41897984706509,
                    -22.641641641954962
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.418993141623474,
                    -22.641702991722013
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.41895325794718,
                    -22.641850231053326
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.41895325794718,
                    -22.64200974015023
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.41891337426975,
                    -22.64241464702519
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.41884690147555,
                    -22.64264777468469
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.418807017798144,
                    -22.642880901948487
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.41877450344319,
                    -22.64338823215165
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.41876120888375,
                    -22.64379313496292
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.418801092561125,
                    -22.644222576035162
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.41904039462227,
                    -22.644333003521567
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.41953229330511,
                    -22.64411214845903
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42006407566433,
                    -22.643768595432633
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42064903625936,
                    -22.643056947145382
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.421380237002296,
                    -22.64338823215165
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42195190303892,
                    -22.643744055897912
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.422098143187895,
                    -22.643928102301786
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42247039083864,
                    -22.644259385206823
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42276287113663,
                    -22.644566127925003
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.423201591582625,
                    -22.64479925193271
                ],
                "type": "Point"
            },
            "id": 62
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42369349026444,
                    -22.6450691845004
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42397267693124,
                    -22.645253230022035
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42421197899242,
                    -22.64520415147875
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42471717223373,
                    -22.644774713475712
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.4257541478342,
                    -22.64395264269713
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42582062062951,
                    -22.645437274403548
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42572755871629,
                    -22.647302243554577
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.4257541478342,
                    -22.648271526729232
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.4257940315116,
                    -22.64979291943419
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42568767674862,
                    -22.65125295112648
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.425727560426,
                    -22.652479855401168
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42580732777972,
                    -22.65325279946488
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42568767674862,
                    -22.65411162109862
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.425754149543906,
                    -22.65499497488804
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42570097130806,
                    -22.65570656130619
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42575784241836,
                    -22.65659466174567
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.425731253300455,
                    -22.657453462471636
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42565148594673,
                    -22.65831225782422
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42571795874204,
                    -22.659171047802246
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42605032271641,
                    -22.65980900259322
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42700753096213,
                    -22.659747660915798
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42776532082402,
                    -22.6595390990055
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.4286028780397,
                    -22.659404147012154
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.42936066790165,
                    -22.658569895382044
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43033117065633,
                    -22.656508782999822
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43111554963514,
                    -22.65645970847973
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43111554963514,
                    -22.655858544184284
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43112883747628,
                    -22.654815701671637
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43112883747628,
                    -22.653944615585672
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.432019572928766,
                    -22.65390780901022
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43207275116458,
                    -22.65303671716427
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43292360293867,
                    -22.653024448225125
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.4337079819185,
                    -22.65287722087531
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43506402693387,
                    -22.652509151809085
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43713797813484,
                    -22.65270545543433
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43818017506311,
                    -22.65283383099687
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.439243739781546,
                    -22.65291971366345
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.44020094802829,
                    -22.653017865218132
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.441370869218304,
                    -22.653017865218132
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.441596876721064,
                    -22.652048615547955
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.44169704296729,
                    -22.651142450385876
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.44175022120314,
                    -22.650136379889403
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.44190975591059,
                    -22.64893399328524
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.44198952326431,
                    -22.64795244539428
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.442188941649135,
                    -22.646774578664377
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.4422820035623,
                    -22.645891171986506
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.44139126811086,
                    -22.6458666328311
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.4409392531054,
                    -22.64598932856451
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.44072654016111,
                    -22.646112024189236
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.44035429251039,
                    -22.646210180609344
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43959650264844,
                    -22.64649237992684
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43858611616588,
                    -22.646848195630866
                ],
                "type": "Point"
            }
        },
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    -50.43809421748409,
                    -22.64802606172934
                ],
                "type": "Point"
            }
        }
    ]
}

const waypoints = geoJsonData.features.map(f => ({
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0]
}))

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function runUnespLoop(chariot, workerId) {
    console.log(`\n[Biga ${workerId}] 🚩 Iniciando Circuito Unesp -> FEMA -> Unesp (${chariot.plate})`)

    for (let i = 0; i < waypoints.length; i++) {
        const pos = waypoints[i]
        const isLastPoint = i === waypoints.length - 1

        const payload = {
            bigaId: chariot.id,
            lat: pos.lat,
            lng: pos.lng,
            // Velocidade simulada variando entre 30 e 50 km/h nas rodovias
            speed: isLastPoint ? 0 : Math.floor(Math.random() * 20) + 30,
            // O gatilho de ignição (isHitched) só desliga no último ponto do CEDAP
            isHitched: !isLastPoint,
            timestamp: new Date().toISOString()
        }

        try {
            const res = await fetch(`${BASE_URL}/telemetry/ingest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                if (i % 20 === 0) {
                    console.log(`📡 [Biga ${workerId}] Passando por: ${(i / waypoints.length * 100).toFixed(0)}% do trajeto...`)
                }
            }
        } catch (e) {
            console.error(`💥 Falha no ponto ${i}:`, e.message)
        }

        // Delay de 500ms para a simulação não ser instantânea, mas rápida o suficiente
        await sleep(500)
    }

    console.log(`🏁 [Biga ${workerId}] Circuito concluído! Trip finalizada e odômetro atualizado.`)
}

async function startSimulation() {
    const fleetRes = await fetch(`${BASE_URL}/fleet`)
    const fleet = await fleetRes.json()

    if (!fleet.length) return console.error('Garagem vazia!')

    // Vamos colocar as primeiras 5 bigas da frota para fazer esse trajeto simultaneamente
    const testFleet = fleet.slice(0, 5)
    console.log(`🏛️  Mobilizando ${testFleet.length} bigas para o circuito Unesp...\n`)

    testFleet.forEach((chariot, index) => runUnespLoop(chariot, index))
}

startSimulation()