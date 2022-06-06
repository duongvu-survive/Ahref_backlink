const LoadCss = () => {
  var LinkStyle = document.createElement("link");
  LinkStyle.setAttribute("rel", "stylesheet");
  LinkStyle.setAttribute(
    "href",
    "https://unpkg.com/element-ui/lib/theme-chalk/index.css"
  );
  document.body.prepend(LinkStyle);
};

document.addEventListener("DOMContentLoaded", function (event) {
  LoadCss();
  // set mutation observer for body when open modal

  const observer = new MutationObserver((mutations) => {
    if (document.body.querySelector(".ReactModalPortal")) {
      eventModalMutation(
        document.body.querySelector(".ReactModalPortal .css-7x6pyi-modalBody")
      );
    }
  });
  observer.observe(document.body, {
    childList: true,
  });

  const eventModalMutation = (el) => {
    const observer = new MutationObserver((mutations) => {
      if (el.querySelector("table")) {
        BuilderData(el, el.querySelector("table"));
      }
    });
    observer.observe(el, {
      childList: true,
    });
  };

  const BuilderData = (root, table) => {
    const getData = (table) => {
      var trs = table.querySelectorAll("tbody tr");
      var data = [];
      for (let i = 0; i < trs.length; i++) {
        var tds = trs[i].querySelectorAll("td");
        var url = tds[0].querySelector("a").getAttribute("href");
        var dr = parseInt(tds[1].textContent);
        var ur = parseInt(tds[2].textContent);
        var refer_domain = parseInt(tds[3].textContent);
        var traffic = parseInt(tds[4].textContent);

        var tagEls = tds[5].querySelectorAll(".css-1ckph53-badge");
        var tags = [];
        tagEls.forEach((item) => {
          tags.push(item.textContent);
        });

        data.push(
          new UrlBacklink(i + 1, url, dr, ur, refer_domain, traffic, tags)
        );
      }
      return data;
    };

    var listUrl = getData(table);
    // console.log(listUrl);
    //  hidden table
    const FilterComponent = Vue.extend({
      template: `
      <div>
      <el-form
        :model="form"
        ref="form"
        
        label-width="80px"
        size="normal"
      >
        <el-row :gutter="20">
          <el-col :span="6" :offset="0">
            <el-form-item label="DR" size="normal">
              <el-slider v-model="form.dr"  :show-input="true" :step="10" range show-stops :max="100">
              </el-slider>
            </el-form-item>
            <el-form-item label="UR" size="normal">
              <el-slider v-model="form.ur"  :show-input="true" :step="10" range show-stops :max="100">
              </el-slider>
            </el-form-item>
          </el-col>
          <el-col :span="6" :offset="0">
            <el-form-item label="Less RF" size="normal">
              <el-input
                v-model="form.rf"
                placeholder=""
                size="normal"
                clearable
                type="number"
              ></el-input>
            </el-form-item>
            <el-form-item label="Relate" size="normal">
              <el-input
                v-model="form.relate"
                placeholder=""
                size="normal"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6" :offset="0">
            <el-form-item label="" size="normal">
              <el-checkbox v-model="form.nofollow">Display nofollow</el-checkbox>
  
            </el-form-item>
          </el-col>
          <el-col :span="6" :offset="0">
            <el-button type="danger" size="default" @click="clear"> Clear </el-button>
          </el-col>
        </el-row>
      </el-form>
      <hr />
      <el-table :data="tableData" border show-summary style="width: 100%">
        <el-table-column prop="url" label="URL">
        <template slot-scope="scope">
           <a :href="scope.row.url" target="_blank">{{scope.row.url}}</a>
        </template>
        </el-table-column>
        <el-table-column prop="dr" sortable label="Domain Rating">
        </el-table-column>
        <el-table-column prop="ur" sortable label="URL Rating"> </el-table-column>
        <el-table-column prop="refer_domain" sortable label="Refer Domain">
        </el-table-column>
        <el-table-column prop="traffic" sortable label="Traffic Domain">
        </el-table-column>
        <el-table-column prop="tags" sortable label="Tags">
        </el-table-column>
      </el-table>
    </div>
          `,
      data() {
        return {
          form: {
            dr: [0, 100],
            ur: [0, 100],
            rf: 50,
            relate: "",
            nofollow: false,
          },
          form_sample: {
            dr: [0, 100],
            ur: [0, 100],
            rf: 50,
            relate: "",
            nofollow: false,
          },
          tableData: JSON.parse(JSON.stringify(listUrl)),
        };
      },
      async created() {
        var form = await this.getForm("form_data");
        console.log(form);
        if (form) {
          this.form = JSON.parse(form);
        }
      },
      methods: {
        getForm(key) {
          return new Promise((resolve, reject) => {
            try {
              chrome.storage.sync.get([key], function (result) {
                return resolve(result[key]);
              });
            } catch (error) {
              return reject(error);
            }
          });
        },
        setForm({ key, value }) {
          return new Promise((resolve, reject) => {
            try {
              const tokenOb = {};
              tokenOb[key] = value;
              chrome.storage.sync.set(tokenOb, function () {
                return resolve(true);
              });
            } catch (error) {
              return reject(error);
            }
          });
        },
        initData() {
          this.tableData = JSON.parse(JSON.stringify(listUrl));
        },
        filter() {
          // filter dr
          var data = JSON.parse(JSON.stringify(listUrl));

          data = data.filter((item) => {
            return item.dr >= this.form.dr[0] && item.dr <= this.form.dr[1];
          });
          data = data.filter((item) => {
            return item.ur >= this.form.ur[0] && item.ur <= this.form.ur[1];
          });
          data = data.filter((item) => {
            return item.refer_domain <= this.form.rf;
          });

          // // relate
          if (this.form.relate) {
            data = data.filter((item) => {
              return item.url.includes(this.form.relate.toLowerCase());
            });
          }
          // // tags
          data = data.filter((item) => {
            return item.tags.includes("NOFOLLOW") == this.form.nofollow;
          });
          // console.log(data);
          this.tableData = data;
        },
        clear() {
          this.form = this.form_sample;
          this.initData();
        },
      },
      watch: {
        form: {
          handler(v) {
            this.setForm({
              key: "form_data",
              value: JSON.stringify(this.form),
            });
            this.filter();
          },
          deep: true,
        },
      },
    });

    var appRoot = root.querySelector(".css-69sdwe-tableWrapperTable");
    table.style.display = "none";

    Vue.component("filter-component", FilterComponent);
    appRoot.setAttribute("id", "app_root");
    appRoot.innerHTML = appRoot.innerHTML + "<p>Total: "+listUrl.length+" links</p><filter-component/>";
    new Vue({
      el: "#app_root",
      data: function () {
        return {};
      },
    });
  };
});
