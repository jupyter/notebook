# Jupyter Notebook

[![Google Group](https://img.shields.io/badge/-Google%20Group-lightgrey.svg)](https://groups.google.com/forum/#!forum/jupyter)
[![Build Status](https://travis-ci.org/jupyter/notebook.svg?branch=master)](https://travis-ci.org/jupyter/notebook)
[![Documentation Status](https://readthedocs.org/projects/jupyter-notebook/badge/?version=latest)](https://jupyter-notebook.readthedocs.io/en/latest/?badge=latest)
                


Jupyter नोटबुक इंटरैक्टिव के लिए एक वेब-आधारित नोटबुक वातावरण है
कंप्यूटिंग।

![Jupyter notebook example](resources/running_code_med.png "Jupyter notebook example")

### नोटिस
कृपया ध्यान दें कि इस भंडार का रखरखाव वर्तमान में जुपिटर समुदाय के एक कंकाल के दल द्वारा किया जाता है। हम उपयोगकर्ताओं को जुपिटरलैब में संक्रमण के लिए प्रोत्साहित करते हैं, जहां अधिक तत्काल समर्थन हो सकता है। हमारा दृष्टिकोण आगे बढ़ेगा:

1. जुपिटर नोटबुक की सुरक्षा बनाए रखने के लिए। इसका मतलब है कि सुरक्षा से संबंधित मुद्दे और पुल अनुरोध हमारी सर्वोच्च प्राथमिकता है।
2. JupyterLab को संबोधित करने के लिए [समता मुद्दों की सुविधा](https://github.com/jupyterlab/jupyterlab/issues?q=is%3Aopen+is%3Aissue+label%3A%22tag%3AFeature+Parity%22)| इस प्रयास के हिस्से के रूप में, हम एक बेहतर [नोटबुक-ओनली एक्सपीरियंस](https://github.com/jupyterlab/jupyterlab/issues/8450)JupyterLab में उन उपयोगकर्ताओं के लिए जो क्लासिक Jupyter नोटबुक के UI को पसंद करते हैं।
3. समुदाय के सदस्यों की कड़ी मेहनत के प्रति उत्तरदायी होना जिन्होंने पुल अनुरोधों को खोला है। हम इन पीआर को ट्राई कर रहे हैं। हम इस समय नई सुविधाओं का समर्थन या रखरखाव नहीं कर सकते हैं, लेकिन हम सुरक्षा और अन्य स्थिरता सुधारों का स्वागत करते हैं।

यदि आपके पास एक नई सुविधा के साथ एक खुला पुल अनुरोध है या यदि आप एक खोलने की योजना बना रहे हैं, तो कृपया इसे [नोटबुक एक्सटेंशन](https://jupyter-notebook.readthedocs.io/en/stable/extending/) के रूप में शिपिंग करने पर विचार करें। बजाय।

##### `नोटबुक` में योगदान करने के लिए विकल्प
इसके अतिरिक्त, कृपया विचार करें कि क्या आपका योगदान Jupyter फ्रंट-एंड के लिए अंतर्निहित सर्वर के लिए उपयुक्त होगा, [jupyter server](https://github.com/jupyter/jupyter_server) या में [JupyterLab फ़्रंट एंड](https://github.com/jupyterlab/jupyterlab).

### जुपिटर नोटबुक, आइपीथॉन नोटबुक की भाषा-अज्ञेय विकास
Jupyter नोटबुक एक भाषा-अज्ञेय HTML नोटबुक अनुप्रयोग है
प्रोजेक्ट जुपिटर। 2015 में, जुपिटर नोटबुक के एक भाग के रूप में जारी किया गया था
IPython कोडबेस का बिग स्प्लिट ™। IPython 3 अंतिम प्रमुख अखंड था
दोनों भाषा-अज्ञेयवादी कोड, जैसे *IPython नोटबुक*,
और भाषा विशिष्ट कोड, जैसे कि *अजगर के लिए आईपीथॉन कर्नेल*। जैसा
कई भाषाओं में कंप्यूटिंग स्पैन, प्रोजेक्ट जुपिटर विकसित करना जारी रखेगा
भाषा-अज्ञेय **जुपिटर नोटबुक** इस रेपो में और की मदद से
समुदाय भाषा विशिष्ट गुठली विकसित करते हैं जो अपने आप में पाए जाते हैं
असतत रेपो।
[[Big Split™ घोषणा](https://blog.jupyter.org/the-big-split-9d7b88a031a7)]
[[Jupyter आरोही ब्लॉग पोस्ट](https://blog.jupyter.org/jupyter-ascending-1bf5b362d97e)]

## स्थापना
आप के लिए स्थापना प्रलेखन पा सकते हैं
[बृहस्पति मंच, ReadTheDocs पर](https://jupyter.readthedocs.io/en/latest/install.html).
जुपिटर नोटबुक के उन्नत उपयोग के लिए दस्तावेज पाया जा सकता है
[यहाँ](https://jupyter-notebook.readthedocs.io/en/latest/).

स्थानीय स्थापना के लिए, सुनिश्चित करें कि आपके पास है
[pip स्थापित](https://pip.readthedocs.io/en/stable/installing/) और भाग खड़ा हुआ:

    $ pip install notebook

## उपयोग - जुपिटर नोटबुक चल रहा है

### स्थानीय स्थापना में चल रहा है

इसके साथ लॉन्च करें:

    $ jupyter notebook

### एक दूरस्थ स्थापना में चल रहा है

आपको बृहस्पति नोटबुक को दूरस्थ रूप से शुरू करने से पहले कुछ कॉन्फ़िगरेशन की आवश्यकता है। देखें [नोटबुक सर्वर चला रहा है](https://jupyter-notebook.readthedocs.io/en/stable/public_server.html).

## विकास स्थापना

स्थानीय विकास की स्थापना कैसे करें, इसके लिए [`CONTRIBUTING.rst`](CONTRIBUTING.rst) देखें।

## योगदान

यदि आप इस परियोजना में योगदान देने में रुचि रखते हैं, तो [`CONTRIBUTING.rst`](CONTRIBUTING.rst) देखें।

## साधन
- [Project Jupyter website](https://jupyter.org)
- [Online Demo at jupyter.org/try](https://jupyter.org/try)
- [Documentation for Jupyter notebook](https://jupyter-notebook.readthedocs.io/en/latest/) [[PDF](https://media.readthedocs.org/pdf/jupyter-notebook/latest/jupyter-notebook.pdf)]
- [Korean Version of Installation](https://github.com/ChungJooHo/Jupyter_Kor_doc/)
- [Documentation for Project Jupyter](https://jupyter.readthedocs.io/en/latest/index.html) [[PDF](https://media.readthedocs.org/pdf/jupyter/latest/jupyter.pdf)]
- [Issues](https://github.com/jupyter/notebook/issues)
- [Technical support - Jupyter Google Group](https://groups.google.com/forum/#!forum/jupyter) 